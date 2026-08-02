const { prisma } = require("../config/database");

// Create a new rating and review
exports.createRating = async (req, res) => {
  try {
    const userId = req.user.id;
    const { rating, review, courseId } = req.body;

    const courseDetails = await prisma.course.findFirst({
      where: {
        id: courseId,
        studentsEnroled: {
          some: {
            id: userId,
          },
        },
      },
    });

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "Student is not enrolled in this course",
      });
    }

    const alreadyReviewed = await prisma.ratingAndReview.findFirst({
      where: {
        userId: userId,
        courseId: courseId,
      },
    });

    if (alreadyReviewed) {
      return res.status(403).json({
        success: false,
        message: "Course already reviewed by user",
      });
    }

    const ratingReview = await prisma.ratingAndReview.create({
      data: {
        rating: parseFloat(rating),
        review,
        courseId,
        userId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Rating and review created successfully",
      ratingReview,
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

// Get the average rating for a course
exports.getAverageRating = async (req, res) => {
  try {
    const courseId = req.body.courseId;

    const aggregations = await prisma.ratingAndReview.aggregate({
      where: {
        courseId: courseId,
      },
      _avg: {
        rating: true,
      },
    });

    const averageRating = aggregations._avg.rating || 0;

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

// Get all rating and reviews
exports.getAllRatingReview = async (req, res) => {
  try {
    const allReviews = await prisma.ratingAndReview.findMany({
      orderBy: { rating: "desc" },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },
        course: {
          select: {
            courseName: true,
          },
        },
      },
    });

    res.status(200).json({
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
