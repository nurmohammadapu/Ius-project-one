const { prisma } = require("../config/database");
const bcrypt = require("bcrypt");

// getAllStudents
exports.getAllStudents = async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: {
        accountType: "Student",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        active: true,
        approved: true,
        image: true,
        createdAt: true,
        additionalDetails: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve students",
    });
  }
};

// getAllInstructors
exports.getAllInstructors = async (req, res) => {
  try {
    const instructors = await prisma.user.findMany({
      where: {
        accountType: "Instructor",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        active: true,
        approved: true,
        image: true,
        createdAt: true,
        additionalDetails: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: instructors,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve instructors",
    });
  }
};

// toggleUserStatus
exports.toggleUserStatus = async (req, res) => {
  try {
    const { userId, active } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { active: !!active },
    });

    return res.status(200).json({
      success: true,
      message: `User status updated to ${updatedUser.active ? "Active" : "Inactive"}`,
      data: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
    });
  }
};

// deleteUser
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete user profile first if exists to prevent foreign key issues
    if (user.profileId) {
      await prisma.profile.delete({
        where: { id: user.profileId },
      }).catch(err => console.log("Profile delete error or not found:", err));
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

// createUser (Admin direct creation)
exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, accountType, contactNumber } = req.body;

    if (!firstName || !lastName || !email || !password || !accountType) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const profileDetails = await prisma.profile.create({
      data: {
        contactNumber: contactNumber || null,
      },
    });

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        accountType,
        approved: true, // Auto-approve admin created instructors
        active: true,
        profileId: profileDetails.id,
        image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
      },
    });

    return res.status(200).json({
      success: true,
      message: `${accountType} created successfully`,
      data: user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

// getAllCourses
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        category: true,
        studentsEnroled: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve courses",
    });
  }
};

// toggleCoursePublish (published / unpublished)
exports.toggleCoursePublish = async (req, res) => {
  try {
    const { courseId, publish } = req.body;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: publish ? "Published" : "Draft",
      },
    });

    return res.status(200).json({
      success: true,
      message: `Course status updated to ${updatedCourse.status}`,
      data: updatedCourse,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update course status",
    });
  }
};

// getFinancialReport
exports.getFinancialReport = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        studentsEnroled: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        instructor: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    let totalRevenue = 0;
    let totalSales = 0;
    const courseBreakdown = [];

    courses.forEach(course => {
      const salesCount = course.studentsEnroled.length;
      const coursePrice = course.price || 0;
      const revenue = salesCount * coursePrice;

      totalRevenue += revenue;
      totalSales += salesCount;

      courseBreakdown.push({
        id: course.id,
        courseName: course.courseName,
        instructor: `${course.instructor.firstName} ${course.instructor.lastName}`,
        price: coursePrice,
        sales: salesCount,
        revenue: revenue,
        status: course.status,
      });
    });

    const totalStudents = await prisma.user.count({
      where: { accountType: "Student" }
    });

    const totalInstructors = await prisma.user.count({
      where: { accountType: "Instructor" }
    });

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalSales,
        totalStudents,
        totalInstructors,
        courseBreakdown,
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate financial report"
    });
  }
};
