// const { prisma } = require("../config/database");
// const { uploadImageToCloudinary } = require("../utils/imageUploader");
// const { convertSecondsToDuration } = require("../utils/secToDuration");

// exports.updateProfile = async (req, res) => {
//   try {
//     const {
//       firstName = "",
//       lastName = "",
//       dateOfBirth = "",
//       about = "",
//       contactNumber = "",
//       gender = "",
//     } = req.body;
//     const userId = req.user.id;
//     const userEmail = req.user.email;

//     const userDetails = await prisma.user.findFirst({
//       where: {
//         OR: [
//           ...(userId ? [{ id: userId }] : []),
//           ...(userEmail ? [{ email: userEmail }] : []),
//         ],
//       },
//       include: { additionalDetails: true },
//     });

//     if (!userDetails) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     if (firstName || lastName) {
//       await prisma.user.update({
//         where: { id: userDetails.id },
//         data: {
//           ...(firstName && { firstName }),
//           ...(lastName && { lastName }),
//         },
//       });
//     }

//     let profileId = userDetails.profileId;
//     if (!profileId) {
//       const newProfile = await prisma.profile.create({
//         data: {
//           dateOfBirth,
//           about,
//           contactNumber,
//           gender,
//         },
//       });
//       profileId = newProfile.id;
//       await prisma.user.update({
//         where: { id: userDetails.id },
//         data: { profileId: newProfile.id },
//       });
//     } else {
//       await prisma.profile.update({
//         where: { id: profileId },
//         data: {
//           dateOfBirth,
//           about,
//           contactNumber,
//           gender,
//         },
//       });
//     }

//     const updatedUserDetails = await prisma.user.findUnique({
//       where: { id: userDetails.id },
//       include: { additionalDetails: true },
//     });

//     return res.json({
//       success: true,
//       message: "Profile updated successfully",
//       updatedUserDetails,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };

// exports.deleteAccount = async (req, res) => {
//   try {
//     const id = req.user.id;

//     const user = await prisma.user.findUnique({
//       where: { id },
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     await prisma.user.delete({
//       where: { id },
//     });

//     res.status(200).json({
//       success: true,
//       message: "User deleted successfully",
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       success: false,
//       message: "User cannot be deleted successfully",
//     });
//   }
// };

// exports.getAllUserDetails = async (req, res) => {
//   try {
//     const id = req.user.id;
//     const email = req.user.email;

//     const userDetails = await prisma.user.findFirst({
//       where: {
//         OR: [
//           ...(id ? [{ id }] : []),
//           ...(email ? [{ email }] : []),
//         ],
//       },
//       include: { additionalDetails: true },
//     });

//     if (!userDetails) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "User Data fetched successfully",
//       data: userDetails,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// exports.updateDisplayPicture = async (req, res) => {
//   try {
//     const displayPicture = req.files.displayPicture;
//     const userId = req.user.id;

//     const image = await uploadImageToCloudinary(
//       displayPicture,
//       process.env.FOLDER_NAME,
//       1000,
//       1000
//     );

//     const updatedProfile = await prisma.user.update({
//       where: { id: userId },
//       data: { image: image.secure_url },
//       include: { additionalDetails: true },
//     });

//     res.send({
//       success: true,
//       message: `Image Updated successfully`,
//       data: updatedProfile,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// exports.getEnrolledCourses = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const userDetails = await prisma.user.findUnique({
//       where: { id: userId },
//       include: {
//         courses: {
//           include: {
//             courseContent: {
//               include: {
//                 subSection: true,
//               },
//             },
//           },
//         },
//       },
//     });

//     if (!userDetails) {
//       return res.status(400).json({
//         success: false,
//         message: `Could not find user with id: ${userId}`,
//       });
//     }

//     const coursesWithProgress = [];

//     for (let i = 0; i < userDetails.courses.length; i++) {
//       const course = { ...userDetails.courses[i] };
//       let totalDurationInSeconds = 0;
//       let SubsectionLength = 0;

//       for (let j = 0; j < course.courseContent.length; j++) {
//         const sec = course.courseContent[j];
//         totalDurationInSeconds += sec.subSection.reduce(
//           (acc, curr) => acc + (parseInt(curr.timeDuration) || 0),
//           0
//         );
//         SubsectionLength += sec.subSection.length;
//       }

//       course.totalDuration = convertSecondsToDuration(totalDurationInSeconds);

//       const courseProgressRecord = await prisma.courseProgress.findFirst({
//         where: {
//           courseID: course.id,
//           userId: userId,
//         },
//         include: { completedVideos: true },
//       });

//       const completedCount = courseProgressRecord?.completedVideos?.length || 0;

//       if (SubsectionLength === 0) {
//         course.progressPercentage = 100;
//       } else {
//         const multiplier = Math.pow(10, 2);
//         course.progressPercentage =
//           Math.round((completedCount / SubsectionLength) * 100 * multiplier) / multiplier;
//       }

//       coursesWithProgress.push(course);
//     }

//     return res.status(200).json({
//       success: true,
//       data: coursesWithProgress,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// exports.instructorDashboard = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const email = req.user.email;

//     const courseDetails = await prisma.course.findMany({
//       where: {
//         OR: [
//           ...(userId ? [{ instructorId: userId }] : []),
//           ...(email ? [{ instructor: { email } }] : []),
//         ],
//       },
//       include: { studentsEnroled: true },
//     });

//     const courseData = courseDetails.map((course) => {
//       const totalStudentsEnrolled = course.studentsEnroled?.length || 0;
//       const totalAmountGenerated = totalStudentsEnrolled * (course.price || 0);

//       return {
//         id: course.id,
//         _id: course.id,
//         courseName: course.courseName,
//         courseDescription: course.courseDescription,
//         totalStudentsEnrolled,
//         totalAmountGenerated,
//       };
//     });

//     res.status(200).json({ courses: courseData });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };


const { prisma } = require("../config/database");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration");

// 1. updateProfile (Pure Raw Query)
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
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    // Find User with Profile details
    const userResult = await prisma.$queryRaw`
      SELECT 
        u.*,
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
      WHERE u.id = ${userId || null} OR u.email = ${userEmail || null}
      LIMIT 1
    `;

    const userDetails = userResult[0];

    if (!userDetails) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update First & Last Name if provided
    if (firstName || lastName) {
      const newFirstName = firstName || userDetails.firstName;
      const newLastName = lastName || userDetails.lastName;

      await prisma.$executeRaw`
        UPDATE "User"
        SET "firstName" = ${newFirstName}, "lastName" = ${newLastName}, "updatedAt" = NOW()
        WHERE id = ${userDetails.id}
      `;
    }

    let profileId = userDetails.profileId;

    if (!profileId) {
      // Create new profile if missing
      const newProfileResult = await prisma.$queryRaw`
        INSERT INTO "Profile" (id, "dateOfBirth", about, "contactNumber", gender, "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid()::text,
          ${dateOfBirth || null},
          ${about || null},
          ${contactNumber || null},
          ${gender || null},
          NOW(),
          NOW()
        )
        RETURNING id
      `;

      profileId = newProfileResult[0].id;

      await prisma.$executeRaw`
        UPDATE "User"
        SET "profileId" = ${profileId}
        WHERE id = ${userDetails.id}
      `;
    } else {
      // Update existing profile
      await prisma.$executeRaw`
        UPDATE "Profile"
        SET 
          "dateOfBirth" = ${dateOfBirth},
          about = ${about},
          "contactNumber" = ${contactNumber},
          gender = ${gender},
          "updatedAt" = NOW()
        WHERE id = ${profileId}
      `;
    }

    // Get Final Updated User
    const updatedUserResult = await prisma.$queryRaw`
      SELECT 
        u.*,
        json_build_object(
          'id', p.id,
          'gender', p.gender,
          'dateOfBirth', p."dateOfBirth",
          'about', p.about,
          'contactNumber', p."contactNumber"
        ) AS "additionalDetails"
      FROM "User" u
      LEFT JOIN "Profile" p ON u."profileId" = p.id
      WHERE u.id = ${userDetails.id}
    `;

    return res.json({
      success: true,
      message: "Profile updated successfully",
      updatedUserDetails: updatedUserResult[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// 2. deleteAccount (Pure Raw Query)
exports.deleteAccount = async (req, res) => {
  try {
    const id = req.user?.id;

    const userResult = await prisma.$queryRaw`
      SELECT id, "profileId" FROM "User" WHERE id = ${id}
    `;

    if (!userResult || userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResult[0];

    // Delete associated Profile if present
    if (user.profileId) {
      await prisma.$executeRaw`DELETE FROM "Profile" WHERE id = ${user.profileId}`.catch(() => {});
    }

    // Delete User
    await prisma.$executeRaw`DELETE FROM "User" WHERE id = ${id}`;

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "User cannot be deleted successfully",
    });
  }
};

// 3. getAllUserDetails (Pure Raw Query)
exports.getAllUserDetails = async (req, res) => {
  try {
    const id = req.user?.id;
    const email = req.user?.email;

    const userResult = await prisma.$queryRaw`
      SELECT 
        u.*,
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
      WHERE u.id = ${id || null} OR u.email = ${email || null}
      LIMIT 1
    `;

    const userDetails = userResult[0];

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

// 4. updateDisplayPicture (Pure Raw Query)
exports.updateDisplayPicture = async (req, res) => {
  try {
    const displayPicture = req.files?.displayPicture;
    const userId = req.user?.id;

    if (!displayPicture) {
      return res.status(400).json({
        success: false,
        message: "Display Picture file is required",
      });
    }

    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );

    await prisma.$executeRaw`
      UPDATE "User"
      SET image = ${image.secure_url}, "updatedAt" = NOW()
      WHERE id = ${userId}
    `;

    const updatedUserResult = await prisma.$queryRaw`
      SELECT 
        u.*,
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
      WHERE u.id = ${userId}
    `;

    res.send({
      success: true,
      message: `Image Updated successfully`,
      data: updatedUserResult[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 5. getEnrolledCourses (Pure Raw Query with Progress Calculation)
exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user?.id;

    // Fetch Enrolled Courses via "_EnrolledStudents" Junction Table
    const enrolledCourses = await prisma.$queryRaw`
      SELECT 
        c.*,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', sec.id,
                'sectionName', sec."sectionName",
                'subSection', COALESCE(
                  (SELECT json_agg(subsec.*) FROM "SubSection" subsec WHERE subsec."sectionId" = sec.id),
                  '[]'::json
                )
              )
            )
            FROM "Section" sec WHERE sec."courseId" = c.id
          ),
          '[]'::json
        ) AS "courseContent"
      FROM "Course" c
      JOIN "_EnrolledStudents" es ON es."A" = c.id
      WHERE es."B" = ${userId}
    `;

    const coursesWithProgress = [];

    for (let i = 0; i < enrolledCourses.length; i++) {
      const course = { ...enrolledCourses[i] };
      let totalDurationInSeconds = 0;
      let SubsectionLength = 0;

      if (course.courseContent) {
        for (let j = 0; j < course.courseContent.length; j++) {
          const sec = course.courseContent[j];
          if (sec.subSection) {
            totalDurationInSeconds += sec.subSection.reduce(
              (acc, curr) => acc + (parseInt(curr.timeDuration) || 0),
              0
            );
            SubsectionLength += sec.subSection.length;
          }
        }
      }

      course.totalDuration = convertSecondsToDuration(totalDurationInSeconds);

      // Fetch Completed Videos Count from "_CompletedVideos"
      const progressResult = await prisma.$queryRaw`
        SELECT COUNT(cv."B")::int AS "completedCount"
        FROM "CourseProgress" cp
        JOIN "_CompletedVideos" cv ON cv."A" = cp.id
        WHERE cp."courseID" = ${course.id} AND cp."userId" = ${userId}
      `;

      const completedCount = Number(progressResult[0]?.completedCount) || 0;

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
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 6. instructorDashboard (Pure Raw Query)
exports.instructorDashboard = async (req, res) => {
  try {
    const userId = req.user?.id;
    const email = req.user?.email;

    const courseDetails = await prisma.$queryRaw`
      SELECT 
        c.id,
        c."courseName",
        c."courseDescription",
        c.price,
        COUNT(es."B")::int AS "totalStudentsEnrolled"
      FROM "Course" c
      LEFT JOIN "User" u ON c."instructorId" = u.id
      LEFT JOIN "_EnrolledStudents" es ON es."A" = c.id
      WHERE c."instructorId" = ${userId || null} OR u.email = ${email || null}
      GROUP BY c.id
    `;

    const courseData = courseDetails.map((course) => {
      const totalStudentsEnrolled = Number(course.totalStudentsEnrolled) || 0;
      const coursePrice = Number(course.price) || 0;
      const totalAmountGenerated = totalStudentsEnrolled * coursePrice;

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