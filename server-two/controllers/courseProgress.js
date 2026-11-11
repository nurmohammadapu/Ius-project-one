const { db } = require("../config/database");
const crypto = require("crypto");

// 1. updateCourseProgress 
exports.updateCourseProgress = async (req, res) => {
  const { courseId, subsectionId, subSectionId } = req.body;
  const targetSubId = subsectionId || subSectionId;
  const userId = req.user?.id;

  if (!courseId || !targetSubId) {
    return res.status(400).json({ success: false, error: "Course ID and Subsection ID are required." });
  }

  try {
    // Check if Subsection Exists
    const subsectionResult = await db.$query`
      SELECT id FROM "SubSection" WHERE id = ${targetSubId}
    `;

    if (!subsectionResult || subsectionResult.length === 0) {
      return res.status(404).json({ success: false, error: "Invalid subsection" });
    }

    // Find or Create Course Progress
    let progressResult = await db.$query`
      SELECT id FROM "CourseProgress"
      WHERE "courseID" = ${courseId} AND "userId" = ${userId}
      LIMIT 1
    `;

    let courseProgressId;

    if (!progressResult || progressResult.length === 0) {
      const newProgress = await db.$query`
        INSERT INTO "CourseProgress" (id, "courseID", "userId")
        VALUES (
          gen_random_uuid()::text,
          ${courseId},
          ${userId}
        )
        RETURNING id
      `;
      courseProgressId = newProgress[0].id;
    } else {
      courseProgressId = progressResult[0].id;
    }

    // Check if video is already completed in "CompletedSubSection" junction table
    const isCompletedResult = await db.$query`
      SELECT * FROM "CompletedSubSection"
      WHERE "courseProgressId" = ${courseProgressId} AND "subSectionId" = ${targetSubId}
    `;

    if (!isCompletedResult || isCompletedResult.length === 0) {
      // Insert into Many-to-Many Junction Table "CompletedSubSection"
      await db.$execute`
        INSERT INTO "CompletedSubSection" ("courseProgressId", "subSectionId")
        VALUES (${courseProgressId}, ${targetSubId})
      `;
    }

    // Check if course is now 100% completed to auto-issue certificate
    const lecturesResult = await db.$query`
      SELECT COUNT(subsec.id)::int AS "totalLectures"
      FROM "Section" sec
      JOIN "SubSection" subsec ON subsec."sectionId" = sec.id
      WHERE sec."courseId" = ${courseId}
    `;
    const totalLectures = Number(lecturesResult[0]?.totalLectures) || 0;

    const progressCountResult = await db.$query`
      SELECT COUNT(cv."subSectionId")::int AS "completedCount"
      FROM "CourseProgress" cp
      JOIN "CompletedSubSection" cv ON cv."courseProgressId" = cp.id
      WHERE cp."courseID" = ${courseId} AND cp."userId" = ${userId}
    `;
    const completedCount = Number(progressCountResult[0]?.completedCount) || 0;

    let certificateGenerated = false;
    let certificateId = null;

    if (totalLectures > 0 && completedCount >= totalLectures) {
      const existingCert = await db.$query`
        SELECT "certificateId" FROM "Certificate"
        WHERE "courseId" = ${courseId} AND "userId" = ${userId}
        LIMIT 1
      `;
      if (!existingCert || existingCert.length === 0) {
        const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
        certificateId = `SN-${new Date().getFullYear()}-${randomSuffix}`;
        await db.$execute`
          INSERT INTO "Certificate" (id, "certificateId", "userId", "courseId", "issueDate")
          VALUES (${crypto.randomUUID()}, ${certificateId}, ${userId}, ${courseId}, NOW())
        `;
        certificateGenerated = true;
      } else {
        certificateId = existingCert[0].certificateId;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Course progress updated",
      courseCompleted: totalLectures > 0 && completedCount >= totalLectures,
      certificateGenerated,
      certificateId,
    });
  } catch (error) {
    console.error("UPDATE COURSE PROGRESS ERROR:", error);
    return res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
};

// 2. getProgressPercentage 
exports.getProgressPercentage = async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user?.id;

  if (!courseId) {
    return res.status(400).json({ error: "Course ID not provided." });
  }

  try {
    // Count completed videos using "CompletedSubSection"
    const progressResult = await db.$query`
      SELECT 
        cp.id,
        COUNT(cv."subSectionId")::int AS "completedCount"
      FROM "CourseProgress" cp
      LEFT JOIN "CompletedSubSection" cv ON cv."courseProgressId" = cp.id
      WHERE cp."courseID" = ${courseId} AND cp."userId" = ${userId}
      GROUP BY cp.id
    `;

    if (!progressResult || progressResult.length === 0) {
      return res.status(400).json({ error: "Can not find Course Progress with these IDs." });
    }

    const completedCount = Number(progressResult[0].completedCount) || 0;

    // Count Total Subsections/Lectures in this Course
    const lecturesResult = await db.$query`
      SELECT COUNT(subsec.id)::int AS "totalLectures"
      FROM "Section" sec
      JOIN "SubSection" subsec ON subsec."sectionId" = sec.id
      WHERE sec."courseId" = ${courseId}
    `;

    const lectures = Number(lecturesResult[0]?.totalLectures) || 0;

    let progressPercentage = 0;
    if (lectures > 0) {
      progressPercentage = (completedCount / lectures) * 100;
      const multiplier = Math.pow(10, 2);
      progressPercentage = Math.round(progressPercentage * multiplier) / multiplier;
    }

    return res.status(200).json({
      data: progressPercentage,
      message: "Succesfully fetched Course progress",
    });
  } catch (error) {
    console.error("GET PROGRESS PERCENTAGE ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
