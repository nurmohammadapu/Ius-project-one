const { prisma } = require("../config/database");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration");
require("dotenv").config();

exports.createCourse = async (req, res) => {
  try {
    const userId = req.user.id;

    let {
      courseName,
      courseDescription,
      whatYouWillLearn,
      price,
      tag: _tag,
      category,
      status,
      instructions: _instructions,
    } = req.body;

    const thumbnail = req.files?.thumbnailImage;

    const tag = typeof _tag === "string" ? JSON.parse(_tag) : _tag;
    const instructions = typeof _instructions === "string" ? JSON.parse(_instructions) : _instructions;

    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !tag?.length ||
      !thumbnail ||
      !category ||
      !instructions?.length
    ) {
      return res.status(400).json({
        success: false,
        message: "All Fields are Mandatory",
      });
    }

    if (!status || status === undefined) {
      status = "Draft";
    }

    const instructorDetails = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!instructorDetails || instructorDetails.accountType !== "Instructor") {
      return res.status(404).json({
        success: false,
        message: "Instructor Details Not Found",
      });
    }

    const categoryDetails = await prisma.category.findUnique({
      where: { id: category },
    });
    if (!categoryDetails) {
      return res.status(404).json({
        success: false,
        message: "Category Details Not Found",
      });
    }

    const thumbnailImage = await uploadImageToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    );

    const newCourse = await prisma.course.create({
      data: {
        courseName,
        courseDescription,
        instructorId: instructorDetails.id,
        whatYouWillLearn,
        price: parseFloat(price),
        tag,
        categoryId: categoryDetails.id,
        thumbnail: thumbnailImage.secure_url,
        status: status,
        instructions,
      },
    });

    res.status(200).json({
      success: true,
      data: newCourse,
      message: "Course Created Successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create course",
      error: error.message,
    });
  }
};

// Get Course List
exports.getAllCourses = async (req, res) => {
  try {
    const allCourses = await prisma.course.findMany({
      where: { status: "Published" },
      select: {
        id: true,
        courseName: true,
        price: true,
        thumbnail: true,
        instructor: true,
        ratingAndReviews: true,
        studentsEnroled: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: allCourses,
    });
  } catch (error) {
    console.log(error);
    return res.status(404).json({
      success: false,
      message: `Can't Fetch Course Data`,
      error: error.message,
    });
  }
};

// getCourseDetails
exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;
    const courseDetails = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          include: {
            additionalDetails: true,
          },
        },
        category: true,
        ratingAndReviews: true,
        courseContent: {
          include: {
            subSection: true,
          },
        },
      },
    });

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      });
    }

    let totalDurationInSeconds = 0;
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration) || 0;
        totalDurationInSeconds += timeDurationInSeconds;
      });
    });

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Edit Course Details
exports.editCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const updates = req.body;
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const updateData = {};

    if (req.files && req.files.thumbnailImage) {
      const thumbnail = req.files.thumbnailImage;
      const thumbnailImage = await uploadImageToCloudinary(
        thumbnail,
        process.env.FOLDER_NAME
      );
      updateData.thumbnail = thumbnailImage.secure_url;
    }

    for (const key in updates) {
      if (updates.hasOwnProperty(key) && key !== "courseId") {
        if (key === "tag" || key === "instructions") {
          updateData[key] = typeof updates[key] === "string" ? JSON.parse(updates[key]) : updates[key];
        } else if (key === "price") {
          updateData.price = parseFloat(updates.price);
        } else if (key === "category") {
          updateData.categoryId = updates.category;
        } else if (["courseName", "courseDescription", "whatYouWillLearn", "status"].includes(key)) {
          updateData[key] = updates[key];
        }
      }
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
      include: {
        instructor: {
          include: {
            additionalDetails: true,
          },
        },
        category: true,
        ratingAndReviews: true,
        courseContent: {
          include: {
            subSection: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getFullCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;
    const courseDetails = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          include: {
            additionalDetails: true,
          },
        },
        category: true,
        ratingAndReviews: true,
        courseContent: {
          include: {
            subSection: true,
          },
        },
      },
    });

    const courseProgressCount = await prisma.courseProgress.findFirst({
      where: {
        courseID: courseId,
        userId: userId,
      },
      include: {
        completedVideos: true,
      },
    });

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      });
    }

    let totalDurationInSeconds = 0;
    courseDetails.courseContent.forEach((content) => {
      content.subSection.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration) || 0;
        totalDurationInSeconds += timeDurationInSeconds;
      });
    });

    const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalDuration,
        completedVideos: courseProgressCount?.completedVideos?.map(v => v.id) || [],
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getInstructorCourses = async (req, res) => {
  try {
    const instructorId = req.user.id;

    const instructorCourses = await prisma.course.findMany({
      where: {
        instructorId: instructorId,
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      data: instructorCourses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve instructor courses",
      error: error.message,
    });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    await prisma.course.delete({
      where: { id: courseId },
    });

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};