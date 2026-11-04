const { db } = require("../config/database");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

// 1. Get all doubts with optional filters
exports.getAllDoubts = async (req, res) => {
  try {
    const { courseId, status, search } = req.query;

    const doubts = await db.$query`
      SELECT 
        dp.id,
        dp.title,
        dp.description,
        dp."mediaUrl",
        dp.status,
        dp."createdAt",
        dp."updatedAt",
        dp."userId",
        u."firstName",
        u."lastName",
        u.image,
        u."accountType",
        c.id AS "courseId",
        c."courseName",
        (SELECT COUNT(dc.id)::int FROM "DoubtComment" dc WHERE dc."postId" = dp.id) AS "commentsCount"
      FROM "DoubtPost" dp
      JOIN "User" u ON u.id = dp."userId"
      LEFT JOIN "Course" c ON c.id = dp."courseId"
      WHERE (${courseId || null}::text IS NULL OR dp."courseId" = ${courseId})
        AND (${status || null}::text IS NULL OR dp.status = ${status})
        AND (${search || null}::text IS NULL OR (
          dp.title ILIKE '%' || ${search || ''} || '%' OR 
          dp.description ILIKE '%' || ${search || ''} || '%'
        ))
      ORDER BY dp."createdAt" DESC
    `;

    return res.status(200).json({
      success: true,
      data: doubts,
    });
  } catch (error) {
    console.error("GET ALL DOUBTS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch doubts" });
  }
};

// 2. Get single doubt post with all comments
exports.getDoubtDetails = async (req, res) => {
  try {
    const postId = req.query.postId || req.params.postId;

    if (!postId) {
      return res.status(400).json({ success: false, message: "Post ID is required" });
    }

    const postResult = await db.$query`
      SELECT 
        dp.id,
        dp.title,
        dp.description,
        dp."mediaUrl",
        dp.status,
        dp."createdAt",
        dp."updatedAt",
        dp."userId",
        u."firstName",
        u."lastName",
        u.image,
        u."accountType",
        c.id AS "courseId",
        c."courseName"
      FROM "DoubtPost" dp
      JOIN "User" u ON u.id = dp."userId"
      LEFT JOIN "Course" c ON c.id = dp."courseId"
      WHERE dp.id = ${postId}
      LIMIT 1
    `;

    if (!postResult || postResult.length === 0) {
      return res.status(404).json({ success: false, message: "Doubt post not found" });
    }

    const comments = await db.$query`
      SELECT 
        dc.id,
        dc."commentText",
        dc."mediaUrl",
        dc."createdAt",
        dc."userId",
        u."firstName",
        u."lastName",
        u.image,
        u."accountType"
      FROM "DoubtComment" dc
      JOIN "User" u ON u.id = dc."userId"
      WHERE dc."postId" = ${postId}
      ORDER BY dc."createdAt" ASC
    `;

    return res.status(200).json({
      success: true,
      data: {
        post: postResult[0],
        comments,
      },
    });
  } catch (error) {
    console.error("GET DOUBT DETAILS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch doubt details" });
  }
};

// 3. Create a new doubt post
exports.createDoubt = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, courseId } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: "Title and description are required" });
    }

    let mediaUrl = req.body.mediaUrl || null;
    const mediaFile = req.files?.media || req.files?.image;
    if (mediaFile) {
      const uploadRes = await uploadImageToCloudinary(
        mediaFile,
        process.env.FOLDER_NAME
      );
      mediaUrl = uploadRes.secure_url;
    }

    const postId = require("crypto").randomUUID();

    await db.$execute`
      INSERT INTO "DoubtPost" (id, "userId", "courseId", title, description, "mediaUrl", status, "createdAt", "updatedAt")
      VALUES (${postId}, ${userId}, ${courseId || null}, ${title.trim()}, ${description.trim()}, ${mediaUrl}, 'OPEN', NOW(), NOW())
    `;

    return res.status(201).json({
      success: true,
      message: "Doubt posted successfully!",
      postId,
      mediaUrl,
    });
  } catch (error) {
    console.error("CREATE DOUBT ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create doubt" });
  }
};

// 4. Add comment/solution to a doubt post
exports.addComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId, commentText } = req.body;

    if (!postId || !commentText || !commentText.trim()) {
      return res.status(400).json({ success: false, message: "postId and commentText are required" });
    }

    let mediaUrl = req.body.mediaUrl || null;
    const mediaFile = req.files?.media || req.files?.image;
    if (mediaFile) {
      const uploadRes = await uploadImageToCloudinary(
        mediaFile,
        process.env.FOLDER_NAME
      );
      mediaUrl = uploadRes.secure_url;
    }

    const commentId = require("crypto").randomUUID();

    await db.$execute`
      INSERT INTO "DoubtComment" (id, "postId", "userId", "commentText", "mediaUrl", "createdAt")
      VALUES (${commentId}, ${postId}, ${userId}, ${commentText.trim()}, ${mediaUrl}, NOW())
    `;

    // Fetch user details to return full comment object
    const userResult = await db.$query`
      SELECT id, "firstName", "lastName", image, "accountType" FROM "User" WHERE id = ${userId} LIMIT 1
    `;

    return res.status(201).json({
      success: true,
      message: "Comment added successfully!",
      commentId,
      data: {
        id: commentId,
        postId,
        commentText: commentText.trim(),
        mediaUrl,
        createdAt: new Date().toISOString(),
        userId,
        author: userResult[0] || null,
      },
    });
  } catch (error) {
    console.error("ADD COMMENT ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to add comment" });
  }
};

// 5. Toggle Resolve status
exports.toggleResolveDoubt = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ success: false, message: "Post ID is required" });
    }

    const postResult = await db.$query`
      SELECT id, "userId", status FROM "DoubtPost" WHERE id = ${postId} LIMIT 1
    `;
    const post = postResult[0];

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const newStatus = post.status === "RESOLVED" ? "OPEN" : "RESOLVED";

    await db.$execute`
      UPDATE "DoubtPost" SET status = ${newStatus}, "updatedAt" = NOW() WHERE id = ${postId}
    `;

    return res.status(200).json({
      success: true,
      message: `Doubt marked as ${newStatus}`,
      status: newStatus,
    });
  } catch (error) {
    console.error("TOGGLE RESOLVE ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to toggle status" });
  }
};

// 6. Delete doubt
exports.deleteDoubt = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ success: false, message: "Post ID is required" });
    }

    const postResult = await db.$query`
      SELECT id, "userId" FROM "DoubtPost" WHERE id = ${postId} LIMIT 1
    `;
    const post = postResult[0];

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.userId !== userId && req.user.accountType !== "Admin") {
      return res.status(403).json({ success: false, message: "Not authorized to delete this post" });
    }

    await db.$execute`
      DELETE FROM "DoubtPost" WHERE id = ${postId}
    `;

    return res.status(200).json({
      success: true,
      message: "Doubt post deleted successfully",
    });
  } catch (error) {
    console.error("DELETE DOUBT ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to delete post" });
  }
};
