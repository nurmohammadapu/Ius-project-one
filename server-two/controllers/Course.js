// const { prisma } = require("../config/database");
// const { uploadImageToCloudinary } = require("../utils/imageUploader");
// const { convertSecondsToDuration } = require("../utils/secToDuration");
// require("dotenv").config();

// exports.createCourse = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     let {
//       courseName,
//       courseDescription,
//       whatYouWillLearn,
//       price,
//       tag: _tag,
//       category,
//       status,
//       instructions: _instructions,
//     } = req.body;

//     const thumbnail = req.files?.thumbnailImage;

//     const tag = typeof _tag === "string" ? JSON.parse(_tag) : _tag;
//     const instructions = typeof _instructions === "string" ? JSON.parse(_instructions) : _instructions;

//     if (
//       !courseName ||
//       !courseDescription ||
//       !whatYouWillLearn ||
//       !price ||
//       !tag?.length ||
//       !thumbnail ||
//       !category ||
//       !instructions?.length
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "All Fields are Mandatory",
//       });
//     }

//     if (!status || status === undefined) {
//       status = "Draft";
//     }

//     const instructorDetails = await prisma.user.findFirst({
//       where: {
//         OR: [
//           ...(userId ? [{ id: userId }] : []),
//           ...(req.user?.email ? [{ email: req.user.email }] : []),
//         ],
//       },
//     });

//     if (!instructorDetails || instructorDetails.accountType !== "Instructor") {
//       console.log("Instructor Details Not Found. req.user:", req.user, "found:", instructorDetails);
//       return res.status(404).json({
//         success: false,
//         message: "Instructor Details Not Found",
//       });
//     }

//     const categoryDetails = await prisma.category.findFirst({
//       where: {
//         OR: [
//           ...(category ? [{ id: category }] : []),
//           ...(category ? [{ name: category }] : []),
//         ],
//       },
//     });
//     if (!categoryDetails) {
//       console.log("Category Details Not Found. category parameter:", category);
//       return res.status(404).json({
//         success: false,
//         message: "Category Details Not Found",
//       });
//     }

//     const thumbnailImage = await uploadImageToCloudinary(
//       thumbnail,
//       process.env.FOLDER_NAME
//     );

//     const newCourse = await prisma.course.create({
//       data: {
//         courseName,
//         courseDescription,
//         instructorId: instructorDetails.id,
//         whatYouWillLearn,
//         price: parseFloat(price),
//         tag,
//         categoryId: categoryDetails.id,
//         thumbnail: thumbnailImage.secure_url,
//         status: status,
//         instructions,
//       },
//       include: {
//         courseContent: {
//           include: {
//             subSection: true,
//           },
//         },
//         category: true,
//         ratingAndReviews: true,
//       },
//     });

//     res.status(200).json({
//       success: true,
//       data: newCourse,
//       message: "Course Created Successfully",
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to create course",
//       error: error.message,
//     });
//   }
// };

// // Get Course List
// exports.getAllCourses = async (req, res) => {
//   try {
//     const allCourses = await prisma.course.findMany({
//       where: { status: "Published" },
//       select: {
//         id: true,
//         courseName: true,
//         price: true,
//         thumbnail: true,
//         instructor: true,
//         ratingAndReviews: true,
//         studentsEnroled: true,
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       data: allCourses,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(404).json({
//       success: false,
//       message: `Can't Fetch Course Data`,
//       error: error.message,
//     });
//   }
// };

// // getCourseDetails
// exports.getCourseDetails = async (req, res) => {
//   try {
//     const { courseId } = req.body;
//     const courseDetails = await prisma.course.findUnique({
//       where: { id: courseId },
//       include: {
//         instructor: {
//           include: {
//             additionalDetails: true,
//           },
//         },
//         category: true,
//         ratingAndReviews: true,
//         studentsEnroled: true,
//         courseContent: {
//           include: {
//             subSection: true,
//           },
//         },
//       },
//     });

//     if (!courseDetails) {
//       return res.status(400).json({
//         success: false,
//         message: `Could not find course with id: ${courseId}`,
//       });
//     }

//     let totalDurationInSeconds = 0;
//     courseDetails.courseContent.forEach((content) => {
//       content.subSection.forEach((subSection) => {
//         const timeDurationInSeconds = parseInt(subSection.timeDuration) || 0;
//         totalDurationInSeconds += timeDurationInSeconds;
//       });
//     });

//     const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

//     return res.status(200).json({
//       success: true,
//       data: {
//         courseDetails,
//         totalDuration,
//       },
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // Edit Course Details
// exports.editCourse = async (req, res) => {
//   try {
//     const { courseId } = req.body;
//     const updates = req.body;
//     const course = await prisma.course.findUnique({ where: { id: courseId } });

//     if (!course) {
//       return res.status(404).json({ error: "Course not found" });
//     }

//     const updateData = {};

//     if (req.files && req.files.thumbnailImage) {
//       const thumbnail = req.files.thumbnailImage;
//       const thumbnailImage = await uploadImageToCloudinary(
//         thumbnail,
//         process.env.FOLDER_NAME
//       );
//       updateData.thumbnail = thumbnailImage.secure_url;
//     }

//     for (const key in updates) {
//       if (updates.hasOwnProperty(key) && key !== "courseId") {
//         if (key === "tag" || key === "instructions") {
//           updateData[key] = typeof updates[key] === "string" ? JSON.parse(updates[key]) : updates[key];
//         } else if (key === "price") {
//           updateData.price = parseFloat(updates.price);
//         } else if (key === "category") {
//           const catVal = updates.category;
//           updateData.categoryId = typeof catVal === "object" ? (catVal?.id || catVal?._id) : catVal;
//         } else if (["courseName", "courseDescription", "whatYouWillLearn", "status"].includes(key)) {
//           updateData[key] = updates[key];
//         }
//       }
//     }

//     const updatedCourse = await prisma.course.update({
//       where: { id: courseId },
//       data: updateData,
//       include: {
//         instructor: {
//           include: {
//             additionalDetails: true,
//           },
//         },
//         category: true,
//         ratingAndReviews: true,
//         courseContent: {
//           include: {
//             subSection: true,
//           },
//         },
//       },
//     });

//     res.json({
//       success: true,
//       message: "Course updated successfully",
//       data: updatedCourse,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// exports.getFullCourseDetails = async (req, res) => {
//   try {
//     const { courseId } = req.body;
//     const userId = req.user.id;
//     const courseDetails = await prisma.course.findUnique({
//       where: { id: courseId },
//       include: {
//         instructor: {
//           include: {
//             additionalDetails: true,
//           },
//         },
//         category: true,
//         ratingAndReviews: true,
//         studentsEnroled: true,
//         courseContent: {
//           include: {
//             subSection: true,
//           },
//         },
//       },
//     });

//     const courseProgressCount = await prisma.courseProgress.findFirst({
//       where: {
//         courseID: courseId,
//         userId: userId,
//       },
//       include: {
//         completedVideos: true,
//       },
//     });

//     if (!courseDetails) {
//       return res.status(400).json({
//         success: false,
//         message: `Could not find course with id: ${courseId}`,
//       });
//     }

//     let totalDurationInSeconds = 0;
//     courseDetails.courseContent.forEach((content) => {
//       content.subSection.forEach((subSection) => {
//         const timeDurationInSeconds = parseInt(subSection.timeDuration) || 0;
//         totalDurationInSeconds += timeDurationInSeconds;
//       });
//     });

//     const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

//     return res.status(200).json({
//       success: true,
//       data: {
//         courseDetails,
//         totalDuration,
//         completedVideos: courseProgressCount?.completedVideos?.map(v => v.id) || [],
//       },
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// exports.getInstructorCourses = async (req, res) => {
//   try {
//     const instructorId = req.user.id;
//     const email = req.user.email;

//     const instructorCourses = await prisma.course.findMany({
//       where: {
//         OR: [
//           ...(instructorId ? [{ instructorId }] : []),
//           ...(email ? [{ instructor: { email } }] : []),
//         ],
//       },
//       include: {
//         studentsEnroled: true,
//         courseContent: {
//           include: {
//             subSection: true,
//           },
//         },
//       },
//       orderBy: { createdAt: "desc" },
//     });

//     const coursesWithDuration = instructorCourses.map((course) => {
//       let totalDurationInSeconds = 0;
//       course.courseContent.forEach((content) => {
//         content.subSection.forEach((subSection) => {
//           const timeDurationInSeconds = parseInt(subSection.timeDuration) || 0;
//           totalDurationInSeconds += timeDurationInSeconds;
//         });
//       });

//       const totalDuration = convertSecondsToDuration(totalDurationInSeconds);
//       return {
//         ...course,
//         totalDuration,
//       };
//     });

//     res.status(200).json({
//       success: true,
//       data: coursesWithDuration,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to retrieve instructor courses",
//       error: error.message,
//     });
//   }
// };

// exports.deleteCourse = async (req, res) => {
//   try {
//     const { courseId } = req.body;

//     const course = await prisma.course.findUnique({ where: { id: courseId } });
//     if (!course) {
//       return res.status(404).json({ message: "Course not found" });
//     }

//     await prisma.course.delete({
//       where: { id: courseId },
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Course deleted successfully",
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };






const { prisma } = require("../config/database");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const { convertSecondsToDuration } = require("../utils/secToDuration");
require("dotenv").config();

// 1. createCourse (Pure Raw Query)
exports.createCourse = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

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

    if (!status) {
      status = "Draft";
    }

    // Find Instructor
    const instructorResult = await prisma.$queryRaw`
      SELECT * FROM "User"
      WHERE (id = ${userId || null} OR email = ${userEmail || null})
        AND "accountType" = 'Instructor'::"AccountType"
      LIMIT 1
    `;

    const instructorDetails = instructorResult[0];

    if (!instructorDetails) {
      return res.status(404).json({
        success: false,
        message: "Instructor Details Not Found",
      });
    }

    // Find Category
    const categoryResult = await prisma.$queryRaw`
      SELECT * FROM "Category"
      WHERE id = ${category} OR name = ${category}
      LIMIT 1
    `;

    const categoryDetails = categoryResult[0];

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

    let tagArr = Array.isArray(tag) ? tag : (typeof tag === "string" ? JSON.parse(tag) : []);
    if (!Array.isArray(tagArr)) tagArr = [tagArr];

    let instructionsArr = Array.isArray(instructions) ? instructions : (typeof instructions === "string" ? JSON.parse(instructions) : []);
    if (!Array.isArray(instructionsArr)) instructionsArr = [instructionsArr];

    const newCourseResult = await prisma.$queryRaw`
      INSERT INTO "Course" (
        id, "courseName", "courseDescription", "instructorId", 
        "whatYouWillLearn", price, tag, "categoryId", 
        thumbnail, status, instructions, "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid()::text,
        ${courseName},
        ${courseDescription},
        ${instructorDetails.id},
        ${whatYouWillLearn},
        ${parseFloat(price)},
        ${tagArr}::text[],
        ${categoryDetails.id},
        ${thumbnailImage.secure_url},
        ${status}::"CourseStatus",
        ${instructionsArr}::text[],
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    const newCourse = newCourseResult[0];

    res.status(200).json({
      success: true,
      data: {
        ...newCourse,
        courseContent: [],
        category: categoryDetails,
        ratingAndReviews: [],
      },
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

// 2. getAllCourses (Pure Raw Query)
exports.getAllCourses = async (req, res) => {
  try {
    const allCourses = await prisma.$queryRaw`
      SELECT 
        c.id,
        c."courseName",
        c.price,
        c.thumbnail,
        json_build_object(
          'id', u.id,
          'firstName', u."firstName",
          'lastName', u."lastName",
          'email', u.email,
          'image', u.image
        ) AS instructor,
        COALESCE(
          (SELECT json_agg(r.*) FROM "RatingAndReview" r WHERE r."courseId" = c.id),
          '[]'::json
        ) AS "ratingAndReviews",
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', u_enrol.id))
            FROM "_EnrolledStudents" es
            JOIN "User" u_enrol ON es."B" = u_enrol.id
            WHERE es."A" = c.id
          ),
          '[]'::json
        ) AS "studentsEnroled"
      FROM "Course" c
      LEFT JOIN "User" u ON c."instructorId" = u.id
      WHERE c.status = 'Published'::"CourseStatus"
    `;

    return res.status(200).json({
      success: true,
      data: allCourses,
    });
  } catch (error) {
    console.error(error);
    return res.status(404).json({
      success: false,
      message: `Can't Fetch Course Data`,
      error: error.message,
    });
  }
};

// 3. getCourseDetails (Pure Raw Query with Nested Content & Duration Calculation)
exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;

    const courseResult = await prisma.$queryRaw`
      SELECT 
        c.*,
        json_build_object(
          'id', u.id,
          'firstName', u."firstName",
          'lastName', u."lastName",
          'email', u.email,
          'image', u.image,
          'additionalDetails', (
            SELECT json_build_object(
              'id', p.id,
              'about', p.about,
              'gender', p.gender,
              'contactNumber', p."contactNumber"
            )
            FROM "Profile" p WHERE p.id = u."profileId"
          )
        ) AS instructor,
        json_build_object(
          'id', cat.id,
          'name', cat.name,
          'description', cat.description
        ) AS category,
        COALESCE(
          (SELECT json_agg(r.*) FROM "RatingAndReview" r WHERE r."courseId" = c.id),
          '[]'::json
        ) AS "ratingAndReviews",
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', es."B"))
            FROM "_EnrolledStudents" es WHERE es."A" = c.id
          ),
          '[]'::json
        ) AS "studentsEnroled",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', sec.id,
                'sectionName', sec."sectionName",
                'subSection', COALESCE(
                  (
                    SELECT json_agg(subsec.*)
                    FROM "SubSection" subsec
                    WHERE subsec."sectionId" = sec.id
                  ),
                  '[]'::json
                )
              )
            )
            FROM "Section" sec
            WHERE sec."courseId" = c.id
          ),
          '[]'::json
        ) AS "courseContent"
      FROM "Course" c
      LEFT JOIN "User" u ON c."instructorId" = u.id
      LEFT JOIN "Category" cat ON c."categoryId" = cat.id
      WHERE c.id = ${courseId}
    `;

    const courseDetails = courseResult[0];

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      });
    }

    let totalDurationInSeconds = 0;
    if (courseDetails.courseContent) {
      courseDetails.courseContent.forEach((content) => {
        if (content.subSection) {
          content.subSection.forEach((subSection) => {
            const timeDurationInSeconds = parseInt(subSection.timeDuration) || 0;
            totalDurationInSeconds += timeDurationInSeconds;
          });
        }
      });
    }

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

// 4. editCourse (Pure Raw Query Dynamic Update)
exports.editCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const updates = req.body;

    const existingCourse = await prisma.$queryRaw`
      SELECT * FROM "Course" WHERE id = ${courseId}
    `;

    if (!existingCourse || existingCourse.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    const currentCourse = existingCourse[0];

    let newThumbnail = currentCourse.thumbnail;
    if (req.files && req.files.thumbnailImage) {
      const thumbnail = req.files.thumbnailImage;
      const thumbnailImage = await uploadImageToCloudinary(
        thumbnail,
        process.env.FOLDER_NAME
      );
      newThumbnail = thumbnailImage.secure_url;
    }

    const courseName = updates.courseName || currentCourse.courseName;
    const courseDescription = updates.courseDescription || currentCourse.courseDescription;
    const whatYouWillLearn = updates.whatYouWillLearn || currentCourse.whatYouWillLearn;
    const price = updates.price !== undefined ? parseFloat(updates.price) : currentCourse.price;
    const status = updates.status || currentCourse.status;

    let categoryId = currentCourse.categoryId;
    if (updates.category) {
      const catVal = updates.category;
      categoryId = typeof catVal === "object" ? (catVal?.id || catVal?._id) : catVal;
    }

    let tag = currentCourse.tag;
    if (updates.tag) {
      tag = typeof updates.tag === "string" ? JSON.parse(updates.tag) : updates.tag;
    }

    let instructions = currentCourse.instructions;
    if (updates.instructions) {
      instructions = typeof updates.instructions === "string" ? JSON.parse(updates.instructions) : updates.instructions;
    }

    let tagArr = Array.isArray(tag) ? tag : (typeof tag === "string" ? JSON.parse(tag) : []);
    if (!Array.isArray(tagArr)) tagArr = [tagArr];

    let instructionsArr = Array.isArray(instructions) ? instructions : (typeof instructions === "string" ? JSON.parse(instructions) : []);
    if (!Array.isArray(instructionsArr)) instructionsArr = [instructionsArr];

    await prisma.$executeRaw`
      UPDATE "Course"
      SET 
        "courseName" = ${courseName},
        "courseDescription" = ${courseDescription},
        "whatYouWillLearn" = ${whatYouWillLearn},
        price = ${price},
        status = ${status}::"CourseStatus",
        thumbnail = ${newThumbnail},
        "categoryId" = ${categoryId},
        tag = ${tagArr}::text[],
        instructions = ${instructionsArr}::text[],
        "updatedAt" = NOW()
      WHERE id = ${courseId}
    `;

    // Fetch Full Updated Course Object
    const updatedCourseResult = await prisma.$queryRaw`
      SELECT 
        c.*,
        json_build_object(
          'id', u.id,
          'firstName', u."firstName",
          'lastName', u."lastName",
          'email', u.email,
          'additionalDetails', (
            SELECT json_build_object('id', p.id, 'about', p.about)
            FROM "Profile" p WHERE p.id = u."profileId"
          )
        ) AS instructor,
        json_build_object('id', cat.id, 'name', cat.name) AS category,
        COALESCE(
          (SELECT json_agg(r.*) FROM "RatingAndReview" r WHERE r."courseId" = c.id),
          '[]'::json
        ) AS "ratingAndReviews",
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
      LEFT JOIN "User" u ON c."instructorId" = u.id
      LEFT JOIN "Category" cat ON c."categoryId" = cat.id
      WHERE c.id = ${courseId}
    `;

    res.json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourseResult[0],
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

// 5. getFullCourseDetails (Pure Raw Query)
exports.getFullCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    const courseResult = await prisma.$queryRaw`
      SELECT 
        c.*,
        json_build_object(
          'id', u.id,
          'firstName', u."firstName",
          'lastName', u."lastName",
          'email', u.email,
          'additionalDetails', (
            SELECT json_build_object('id', p.id, 'about', p.about)
            FROM "Profile" p WHERE p.id = u."profileId"
          )
        ) AS instructor,
        json_build_object('id', cat.id, 'name', cat.name) AS category,
        COALESCE(
          (SELECT json_agg(r.*) FROM "RatingAndReview" r WHERE r."courseId" = c.id),
          '[]'::json
        ) AS "ratingAndReviews",
        COALESCE(
          (SELECT json_agg(json_build_object('id', es."B")) FROM "_EnrolledStudents" es WHERE es."A" = c.id),
          '[]'::json
        ) AS "studentsEnroled",
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
      LEFT JOIN "User" u ON c."instructorId" = u.id
      LEFT JOIN "Category" cat ON c."categoryId" = cat.id
      WHERE c.id = ${courseId}
    `;

    const courseDetails = courseResult[0];

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      });
    }

    // Get Course Progress
    const progressResult = await prisma.$queryRaw`
      SELECT cp.id,
        COALESCE(
          (
            SELECT json_agg(json_build_object('id', subsec.id))
            FROM "_CompletedVideos" cv
            JOIN "SubSection" subsec ON cv."B" = subsec.id
            WHERE cv."A" = cp.id
          ),
          '[]'::json
        ) AS "completedVideos"
      FROM "CourseProgress" cp
      WHERE cp."courseID" = ${courseId} AND cp."userId" = ${userId}
      LIMIT 1
    `;

    const courseProgressCount = progressResult[0];

    let totalDurationInSeconds = 0;
    if (courseDetails.courseContent) {
      courseDetails.courseContent.forEach((content) => {
        if (content.subSection) {
          content.subSection.forEach((subSection) => {
            const timeDurationInSeconds = parseInt(subSection.timeDuration) || 0;
            totalDurationInSeconds += timeDurationInSeconds;
          });
        }
      });
    }

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

// 6. getInstructorCourses (Pure Raw Query)
exports.getInstructorCourses = async (req, res) => {
  try {
    const instructorId = req.user?.id;
    const email = req.user?.email;

    const instructorCourses = await prisma.$queryRaw`
      SELECT 
        c.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', es."B")) FROM "_EnrolledStudents" es WHERE es."A" = c.id),
          '[]'::json
        ) AS "studentsEnroled",
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
      LEFT JOIN "User" u ON c."instructorId" = u.id
      WHERE c."instructorId" = ${instructorId || null} OR u.email = ${email || null}
      ORDER BY c."createdAt" DESC
    `;

    const coursesWithDuration = instructorCourses.map((course) => {
      let totalDurationInSeconds = 0;
      if (course.courseContent) {
        course.courseContent.forEach((content) => {
          if (content.subSection) {
            content.subSection.forEach((subSection) => {
              const timeDurationInSeconds = parseInt(subSection.timeDuration) || 0;
              totalDurationInSeconds += timeDurationInSeconds;
            });
          }
        });
      }

      const totalDuration = convertSecondsToDuration(totalDurationInSeconds);
      return {
        ...course,
        totalDuration,
      };
    });

    res.status(200).json({
      success: true,
      data: coursesWithDuration,
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

// 7. deleteCourse (Pure Raw Query CASCADE Clean)
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    const courseResult = await prisma.$queryRaw`
      SELECT id FROM "Course" WHERE id = ${courseId}
    `;

    if (!courseResult || courseResult.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Manual Cascade Deletion in Order for Clean Up
    await prisma.$executeRaw`DELETE FROM "RatingAndReview" WHERE "courseId" = ${courseId}`;
    await prisma.$executeRaw`DELETE FROM "CourseProgress" WHERE "courseID" = ${courseId}`;
    await prisma.$executeRaw`DELETE FROM "_EnrolledStudents" WHERE "A" = ${courseId}`;
    
    // Delete Subsections and Sections
    await prisma.$executeRaw`
      DELETE FROM "SubSection" 
      WHERE "sectionId" IN (SELECT id FROM "Section" WHERE "courseId" = ${courseId})
    `;
    await prisma.$executeRaw`DELETE FROM "Section" WHERE "courseId" = ${courseId}`;

    // Finally Delete Course
    await prisma.$executeRaw`DELETE FROM "Course" WHERE id = ${courseId}`;

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