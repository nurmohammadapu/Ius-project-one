const { db } = require("../config/database");

// 1. Create a new rating and review (Pure Raw Query - Fixed Columns)
exports.createRating = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { rating, review, courseId } = req.body;

    if (!rating || !review || !courseId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // A. Check if Student is Enrolled via "_EnrolledStudents" Junction Table
    const enrollmentCheck = await db.$query`
      SELECT "A" FROM "_EnrolledStudents"
      WHERE "A" = ${courseId} AND "B" = ${userId}
      LIMIT 1
    `;

    if (!enrollmentCheck || enrollmentCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student is not enrolled in this course",
      });
    }

    // B. Check if already reviewed
    const existingReview = await db.$query`
      SELECT id FROM "RatingAndReview"
      WHERE "userId" = ${userId} AND "courseId" = ${courseId}
      LIMIT 1
    `;

    if (existingReview && existingReview.length > 0) {
      return res.status(403).json({
        success: false,
        message: "Course already reviewed by user",
      });
    }

    // C. Insert New Rating & Review (Removed createdAt / updatedAt)
    const newReviewResult = await db.$query`
      INSERT INTO "RatingAndReview" (id, rating, review, "courseId", "userId")
      VALUES (
        gen_random_uuid()::text,
        ${parseFloat(rating)},
        ${review},
        ${courseId},
        ${userId}
      )
      RETURNING *
    `;

    return res.status(201).json({
      success: true,
      message: "Rating and review created successfully",
      ratingReview: newReviewResult[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// 2. Get the average rating for a course (Pure Raw Query)
exports.getAverageRating = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required",
      });
    }

    const aggregationResult = await db.$query`
      SELECT COALESCE(AVG(rating), 0)::float AS "averageRating"
      FROM "RatingAndReview"
      WHERE "courseId" = ${courseId}
    `;

    const averageRating = aggregationResult[0]?.averageRating || 0;

    return res.status(200).json({
      success: true,
      averageRating: averageRating,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve the rating for the course",
      error: error.message,
    });
  }
};

// 3. Get all rating and reviews (Pure Raw Query)
exports.getAllRatingReview = async (req, res) => {
  try {
    const allReviews = await db.$query`
      SELECT 
        r.*,
        json_build_object(
          'firstName', u."firstName",
          'lastName', u."lastName",
          'email', u.email,
          'image', u.image
        ) AS user,
        json_build_object(
          'courseName', c."courseName"
        ) AS course
      FROM "RatingAndReview" r
      LEFT JOIN "User" u ON r."userId" = u.id
      LEFT JOIN "Course" c ON r."courseId" = c.id
      ORDER BY r.rating DESC
    `;

    return res.status(200).json({
      success: true,
      data: allReviews,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve the rating and review for the course",
      error: error.message,
    });
  }
};