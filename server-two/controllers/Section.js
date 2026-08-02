// const { prisma } = require("../config/database");

// // CREATE a new section
// exports.createSection = async (req, res) => {
//   try {
//     const { sectionName, courseId } = req.body;

//     if (!sectionName || !courseId) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required properties",
//       });
//     }

//     const newSection = await prisma.section.create({
//       data: {
//         sectionName,
//         courseId,
//       },
//     });

//     const updatedCourse = await prisma.course.findUnique({
//       where: { id: courseId },
//       include: {
//         courseContent: {
//           include: {
//             subSection: true,
//           },
//         },
//       },
//     });

//     res.status(200).json({
//       success: true,
//       message: "Section created successfully",
//       updatedCourse,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// // UPDATE a section
// exports.updateSection = async (req, res) => {
//   try {
//     const { sectionName, sectionId, courseId } = req.body;

//     const section = await prisma.section.update({
//       where: { id: sectionId },
//       data: { sectionName },
//     });

//     const course = await prisma.course.findUnique({
//       where: { id: courseId },
//       include: {
//         courseContent: {
//           include: {
//             subSection: true,
//           },
//         },
//       },
//     });

//     res.status(200).json({
//       success: true,
//       message: section,
//       data: course,
//     });
//   } catch (error) {
//     console.error("Error updating section:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// // DELETE a section
// exports.deleteSection = async (req, res) => {
//   try {
//     const { sectionId, courseId } = req.body;

//     const section = await prisma.section.findUnique({
//       where: { id: sectionId },
//     });

//     if (!section) {
//       return res.status(404).json({
//         success: false,
//         message: "Section not found",
//       });
//     }

//     await prisma.section.delete({
//       where: { id: sectionId },
//     });

//     const course = await prisma.course.findUnique({
//       where: { id: courseId },
//       include: {
//         courseContent: {
//           include: {
//             subSection: true,
//           },
//         },
//       },
//     });

//     res.status(200).json({
//       success: true,
//       message: "Section deleted",
//       data: course,
//     });
//   } catch (error) {
//     console.error("Error deleting section:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };


const { prisma } = require("../config/database");

// Helper function to fetch course with nested content
async function getCourseWithContent(courseId) {
  const result = await prisma.$queryRaw`
    SELECT 
      c.*,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', sec.id,
              'sectionName', sec."sectionName",
              'courseId', sec."courseId",
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
    WHERE c.id = ${courseId}
  `;
  return result[0] || null;
}

// 1. CREATE a new section (Pure Raw Query)
exports.createSection = async (req, res) => {
  try {
    const { sectionName, courseId } = req.body;

    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Missing required properties",
      });
    }

    // Insert Section
    await prisma.$executeRaw`
      INSERT INTO "Section" (id, "sectionName", "courseId")
      VALUES (
        gen_random_uuid()::text,
        ${sectionName},
        ${courseId}
      )
    `;

    // Fetch Updated Course
    const updatedCourse = await getCourseWithContent(courseId);

    return res.status(200).json({
      success: true,
      message: "Section created successfully",
      updatedCourse,
    });
  } catch (error) {
    console.error("Error creating section:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// 2. UPDATE a section (Pure Raw Query)
exports.updateSection = async (req, res) => {
  try {
    const { sectionName, sectionId, courseId } = req.body;

    if (!sectionId || !sectionName) {
      return res.status(400).json({
        success: false,
        message: "Section ID and Section Name are required",
      });
    }

    // Update Section
    const updatedSectionResult = await prisma.$queryRaw`
      UPDATE "Section"
      SET "sectionName" = ${sectionName}
      WHERE id = ${sectionId}
      RETURNING *
    `;

    const section = updatedSectionResult[0];

    // Fetch Updated Course Details
    const course = await getCourseWithContent(courseId);

    return res.status(200).json({
      success: true,
      message: section,
      data: course,
    });
  } catch (error) {
    console.error("Error updating section:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// 3. DELETE a section (Pure Raw Query)
exports.deleteSection = async (req, res) => {
  try {
    const { sectionId, courseId } = req.body;

    if (!sectionId) {
      return res.status(400).json({
        success: false,
        message: "Section ID is required",
      });
    }

    // Check if section exists
    const sectionResult = await prisma.$queryRaw`
      SELECT id FROM "Section" WHERE id = ${sectionId}
    `;

    if (!sectionResult || sectionResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Delete associated SubSections first to prevent Foreign Key constraint error
    await prisma.$executeRaw`
      DELETE FROM "SubSection" WHERE "sectionId" = ${sectionId}
    `;

    // Delete Section
    await prisma.$executeRaw`
      DELETE FROM "Section" WHERE id = ${sectionId}
    `;

    // Fetch Updated Course Details
    const course = await getCourseWithContent(courseId);

    return res.status(200).json({
      success: true,
      message: "Section deleted",
      data: course,
    });
  } catch (error) {
    console.error("Error deleting section:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};