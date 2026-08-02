// const { prisma } = require("../config/database");
// const bcrypt = require("bcrypt");

// // getAllStudents
// exports.getAllStudents = async (req, res) => {
//   try {
//     const students = await prisma.user.findMany({
//       where: {
//         accountType: "Student",
//       },
//       select: {
//         id: true,
//         firstName: true,
//         lastName: true,
//         email: true,
//         active: true,
//         approved: true,
//         image: true,
//         createdAt: true,
//         additionalDetails: true,
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       data: students,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to retrieve students",
//     });
//   }
// };

// // getAllInstructors
// exports.getAllInstructors = async (req, res) => {
//   try {
//     const instructors = await prisma.user.findMany({
//       where: {
//         accountType: "Instructor",
//       },
//       select: {
//         id: true,
//         firstName: true,
//         lastName: true,
//         email: true,
//         active: true,
//         approved: true,
//         image: true,
//         createdAt: true,
//         additionalDetails: true,
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       data: instructors,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to retrieve instructors",
//     });
//   }
// };

// // toggleUserStatus
// exports.toggleUserStatus = async (req, res) => {
//   try {
//     const { userId, active } = req.body;

//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     const updatedUser = await prisma.user.update({
//       where: { id: userId },
//       data: { active: !!active },
//     });

//     return res.status(200).json({
//       success: true,
//       message: `User status updated to ${updatedUser.active ? "Active" : "Inactive"}`,
//       data: updatedUser,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update user status",
//     });
//   }
// };

// // deleteUser
// exports.deleteUser = async (req, res) => {
//   try {
//     const { userId } = req.body;

//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // Delete user profile first if exists to prevent foreign key issues
//     if (user.profileId) {
//       await prisma.profile.delete({
//         where: { id: user.profileId },
//       }).catch(err => console.log("Profile delete error or not found:", err));
//     }

//     await prisma.user.delete({
//       where: { id: userId },
//     });

//     return res.status(200).json({
//       success: true,
//       message: "User deleted successfully",
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to delete user",
//     });
//   }
// };

// // createUser (Admin direct creation)
// exports.createUser = async (req, res) => {
//   try {
//     const { firstName, lastName, email, password, accountType, contactNumber } = req.body;

//     if (!firstName || !lastName || !email || !password || !accountType) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required",
//       });
//     }

//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: "User already exists with this email",
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const profileDetails = await prisma.profile.create({
//       data: {
//         contactNumber: contactNumber || null,
//       },
//     });

//     const user = await prisma.user.create({
//       data: {
//         firstName,
//         lastName,
//         email,
//         password: hashedPassword,
//         accountType,
//         approved: true, // Auto-approve admin created instructors
//         active: true,
//         profileId: profileDetails.id,
//         image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       message: `${accountType} created successfully`,
//       data: user,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to create user",
//     });
//   }
// };

// // getAllCourses
// exports.getAllCourses = async (req, res) => {
//   try {
//     const courses = await prisma.course.findMany({
//       include: {
//         instructor: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true,
//           },
//         },
//         category: true,
//         studentsEnroled: true,
//       },
//       orderBy: { createdAt: "desc" },
//     });

//     return res.status(200).json({
//       success: true,
//       data: courses,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to retrieve courses",
//     });
//   }
// };

// // toggleCoursePublish (published / unpublished)
// exports.toggleCoursePublish = async (req, res) => {
//   try {
//     const { courseId, publish } = req.body;

//     const course = await prisma.course.findUnique({
//       where: { id: courseId },
//     });

//     if (!course) {
//       return res.status(404).json({
//         success: false,
//         message: "Course not found",
//       });
//     }

//     const updatedCourse = await prisma.course.update({
//       where: { id: courseId },
//       data: {
//         status: publish ? "Published" : "Draft",
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       message: `Course status updated to ${updatedCourse.status}`,
//       data: updatedCourse,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to update course status",
//     });
//   }
// };

// // getFinancialReport
// exports.getFinancialReport = async (req, res) => {
//   try {
//     const courses = await prisma.course.findMany({
//       include: {
//         studentsEnroled: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true,
//           }
//         },
//         instructor: {
//           select: {
//             firstName: true,
//             lastName: true,
//           }
//         }
//       }
//     });

//     let totalRevenue = 0;
//     let totalSales = 0;
//     const courseBreakdown = [];

//     courses.forEach(course => {
//       const salesCount = course.studentsEnroled.length;
//       const coursePrice = course.price || 0;
//       const revenue = salesCount * coursePrice;

//       totalRevenue += revenue;
//       totalSales += salesCount;

//       courseBreakdown.push({
//         id: course.id,
//         courseName: course.courseName,
//         instructor: `${course.instructor.firstName} ${course.instructor.lastName}`,
//         price: coursePrice,
//         sales: salesCount,
//         revenue: revenue,
//         status: course.status,
//       });
//     });

//     const totalStudents = await prisma.user.count({
//       where: { accountType: "Student" }
//     });

//     const totalInstructors = await prisma.user.count({
//       where: { accountType: "Instructor" }
//     });

//     return res.status(200).json({
//       success: true,
//       data: {
//         totalRevenue,
//         totalSales,
//         totalStudents,
//         totalInstructors,
//         courseBreakdown,
//       }
//     });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to generate financial report"
//     });
//   }
// };








const { prisma } = require("../config/database");
const bcrypt = require("bcrypt");

// 1. getAllStudents (Raw SQL with JOIN)
exports.getAllStudents = async (req, res) => {
  try {
    const students = await prisma.$queryRaw`
      SELECT 
        u.id, 
        u."firstName", 
        u."lastName", 
        u.email, 
        u.active, 
        u.approved, 
        u.image, 
        u."createdAt", 
        CASE 
          WHEN p.id IS NOT NULL THEN json_build_object(
            'id', p.id,
            'gender', p.gender,
            'dateOfBirth', p."dateOfBirth",
            'about', p.about,
            'contactNumber', p."contactNumber"
          )
          ELSE NULL 
        END AS "additionalDetails"
      FROM "User" u
      LEFT JOIN "Profile" p ON u."profileId" = p.id
      WHERE u."accountType" = 'Student'::"AccountType"
    `;

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

// 2. getAllInstructors (Raw SQL with JOIN)
exports.getAllInstructors = async (req, res) => {
  try {
    const instructors = await prisma.$queryRaw`
      SELECT 
        u.id, 
        u."firstName", 
        u."lastName", 
        u.email, 
        u.active, 
        u.approved, 
        u.image, 
        u."createdAt", 
        CASE 
          WHEN p.id IS NOT NULL THEN json_build_object(
            'id', p.id,
            'gender', p.gender,
            'dateOfBirth', p."dateOfBirth",
            'about', p.about,
            'contactNumber', p."contactNumber"
          )
          ELSE NULL 
        END AS "additionalDetails"
      FROM "User" u
      LEFT JOIN "Profile" p ON u."profileId" = p.id
      WHERE u."accountType" = 'Instructor'::"AccountType"
    `;

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

// 3. toggleUserStatus (Raw SQL UPDATE)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { userId, active } = req.body;

    const users = await prisma.$queryRaw`
      SELECT id FROM "User" WHERE id = ${userId}
    `;

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isActive = !!active;

    const updatedUsers = await prisma.$queryRaw`
      UPDATE "User"
      SET active = ${isActive}
      WHERE id = ${userId}
      RETURNING *
    `;

    return res.status(200).json({
      success: true,
      message: `User status updated to ${updatedUsers[0].active ? "Active" : "Inactive"}`,
      data: updatedUsers[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
    });
  }
};

// 4. deleteUser 
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;

    const users = await prisma.$queryRaw`
      SELECT id, "profileId" FROM "User" WHERE id = ${userId}
    `;

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = users[0];

    // Delete user profile first
    if (user.profileId) {
      await prisma.$executeRaw`
        DELETE FROM "Profile" WHERE id = ${user.profileId}
      `.catch((err) => console.log("Profile delete error:", err));
    }

    await prisma.$executeRaw`
      DELETE FROM "User" WHERE id = ${userId}
    `;

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

// 5. createUser 
exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, accountType, contactNumber } = req.body;

    if (!firstName || !lastName || !email || !password || !accountType) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUsers = await prisma.$queryRaw`
      SELECT id FROM "User" WHERE email = ${email}
    `;

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Profile Insert
    const newProfiles = await prisma.$queryRaw`
      INSERT INTO "Profile" (id, "contactNumber")
      VALUES (gen_random_uuid()::text, ${contactNumber || null})
      RETURNING id
    `;

    const profileId = newProfiles[0]?.id;
    const imageUrl = `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`;

    // User Insert with Enum Casting
    const newUsers = await prisma.$queryRaw`
      INSERT INTO "User" (
        id, "firstName", "lastName", email, password, "accountType", 
        approved, active, "profileId", image, "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid()::text, ${firstName}, ${lastName}, ${email}, ${hashedPassword}, ${accountType}::"AccountType",
        true, true, ${profileId}, ${imageUrl}, NOW(), NOW()
      )
      RETURNING *
    `;

    return res.status(200).json({
      success: true,
      message: `${accountType} created successfully`,
      data: newUsers[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

// 6. getAllCourses
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await prisma.$queryRaw`
      SELECT 
        c.*,
        json_build_object(
          'id', u.id,
          'firstName', u."firstName",
          'lastName', u."lastName",
          'email', u.email
        ) AS instructor,
        CASE 
          WHEN cat.id IS NOT NULL THEN json_build_object(
            'id', cat.id,
            'name', cat.name
          )
          ELSE NULL 
        END AS category
      FROM "Course" c
      LEFT JOIN "User" u ON c."instructorId" = u.id
      LEFT JOIN "Category" cat ON c."categoryId" = cat.id
      ORDER BY c."createdAt" DESC
    `;

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

// 7. toggleCoursePublish 
exports.toggleCoursePublish = async (req, res) => {
  try {
    const { courseId, publish } = req.body;

    const courses = await prisma.$queryRaw`
      SELECT id FROM "Course" WHERE id = ${courseId}
    `;

    if (!courses || courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const newStatus = publish ? "Published" : "Draft";

    const updatedCourses = await prisma.$queryRaw`
      UPDATE "Course"
      SET status = ${newStatus}::"CourseStatus"
      WHERE id = ${courseId}
      RETURNING *
    `;

    return res.status(200).json({
      success: true,
      message: `Course status updated to ${updatedCourses[0].status}`,
      data: updatedCourses[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update course status",
    });
  }
};

// 8. getFinancialReport (Raw SQL Many-To-Many JOIN)
exports.getFinancialReport = async (req, res) => {
  try {
    // Implicit Many-To-Many Table: "_EnrolledStudents"
    const courses = await prisma.$queryRaw`
      SELECT 
        c.id,
        c."courseName",
        c.price,
        c.status,
        u."firstName" AS "instructorFirstName",
        u."lastName" AS "instructorLastName",
        COUNT(es."B")::int AS "salesCount"
      FROM "Course" c
      LEFT JOIN "User" u ON c."instructorId" = u.id
      LEFT JOIN "_EnrolledStudents" es ON es."A" = c.id
      GROUP BY c.id, u.id
    `;

    let totalRevenue = 0;
    let totalSales = 0;
    const courseBreakdown = [];

    courses.forEach((course) => {
      const salesCount = Number(course.salesCount) || 0;
      const coursePrice = Number(course.price) || 0;
      const revenue = salesCount * coursePrice;

      totalRevenue += revenue;
      totalSales += salesCount;

      courseBreakdown.push({
        id: course.id,
        courseName: course.courseName,
        instructor: `${course.instructorFirstName || ''} ${course.instructorLastName || ''}`.trim(),
        price: coursePrice,
        sales: salesCount,
        revenue: revenue,
        status: course.status,
      });
    });

    const studentCountResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count FROM "User" WHERE "accountType" = 'Student'::"AccountType"
    `;
    
    const instructorCountResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count FROM "User" WHERE "accountType" = 'Instructor'::"AccountType"
    `;

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalSales,
        totalStudents: studentCountResult[0]?.count || 0,
        totalInstructors: instructorCountResult[0]?.count || 0,
        courseBreakdown,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate financial report",
    });
  }
};