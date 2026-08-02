const { prisma } = require("../config/database");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration");

exports.updateProfile = async (req, res) => {
  try {
    const {
      firstName = "",
      lastName = "",
      dateOfBirth = "",
      about = "",
      contactNumber = "",
      gender = "",
    } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    const userDetails = await prisma.user.findFirst({
      where: {
        OR: [
          ...(userId ? [{ id: userId }] : []),
          ...(userEmail ? [{ email: userEmail }] : []),
        ],
      },
      include: { additionalDetails: true },
    });

    if (!userDetails) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (firstName || lastName) {
      await prisma.user.update({
        where: { id: userDetails.id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
        },
      });
    }

    let profileId = userDetails.profileId;
    if (!profileId) {
      const newProfile = await prisma.profile.create({
        data: {
          dateOfBirth,
          about,
          contactNumber,
          gender,
        },
      });
      profileId = newProfile.id;
      await prisma.user.update({
        where: { id: userDetails.id },
        data: { profileId: newProfile.id },
      });
    } else {
      await prisma.profile.update({
        where: { id: profileId },
        data: {
          dateOfBirth,
          about,
          contactNumber,
          gender,
        },
      });
    }

    const updatedUserDetails = await prisma.user.findUnique({
      where: { id: userDetails.id },
      include: { additionalDetails: true },
    });

    return res.json({
      success: true,
      message: "Profile updated successfully",
      updatedUserDetails,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const id = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "User cannot be deleted successfully",
    });
  }
};

exports.getAllUserDetails = async (req, res) => {
  try {
    const id = req.user.id;
    const email = req.user.email;

    const userDetails = await prisma.user.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
      include: { additionalDetails: true },
    });

    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User Data fetched successfully",
      data: userDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateDisplayPicture = async (req, res) => {
  try {
    const displayPicture = req.files.displayPicture;
    const userId = req.user.id;

    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );

    const updatedProfile = await prisma.user.update({
      where: { id: userId },
      data: { image: image.secure_url },
      include: { additionalDetails: true },
    });

    res.send({
      success: true,
      message: `Image Updated successfully`,
      data: updatedProfile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;

    const userDetails = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        courses: {
          include: {
            courseContent: {
              include: {
                subSection: true,
              },
            },
          },
        },
      },
    });

    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find user with id: ${userId}`,
      });
    }

    const coursesWithProgress = [];

    for (let i = 0; i < userDetails.courses.length; i++) {
      const course = { ...userDetails.courses[i] };
      let totalDurationInSeconds = 0;
      let SubsectionLength = 0;

      for (let j = 0; j < course.courseContent.length; j++) {
        const sec = course.courseContent[j];
        totalDurationInSeconds += sec.subSection.reduce(
          (acc, curr) => acc + (parseInt(curr.timeDuration) || 0),
          0
        );
        SubsectionLength += sec.subSection.length;
      }

      course.totalDuration = convertSecondsToDuration(totalDurationInSeconds);

      const courseProgressRecord = await prisma.courseProgress.findFirst({
        where: {
          courseID: course.id,
          userId: userId,
        },
        include: { completedVideos: true },
      });

      const completedCount = courseProgressRecord?.completedVideos?.length || 0;

      if (SubsectionLength === 0) {
        course.progressPercentage = 100;
      } else {
        const multiplier = Math.pow(10, 2);
        course.progressPercentage =
          Math.round((completedCount / SubsectionLength) * 100 * multiplier) / multiplier;
      }

      coursesWithProgress.push(course);
    }

    return res.status(200).json({
      success: true,
      data: coursesWithProgress,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.instructorDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const email = req.user.email;

    const courseDetails = await prisma.course.findMany({
      where: {
        OR: [
          ...(userId ? [{ instructorId: userId }] : []),
          ...(email ? [{ instructor: { email } }] : []),
        ],
      },
      include: { studentsEnroled: true },
    });

    const courseData = courseDetails.map((course) => {
      const totalStudentsEnrolled = course.studentsEnroled?.length || 0;
      const totalAmountGenerated = totalStudentsEnrolled * (course.price || 0);

      return {
        id: course.id,
        _id: course.id,
        courseName: course.courseName,
        courseDescription: course.courseDescription,
        totalStudentsEnrolled,
        totalAmountGenerated,
      };
    });

    res.status(200).json({ courses: courseData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
