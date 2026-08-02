// const { prisma } = require("../config/database");

// exports.updateCourseProgress = async (req, res) => {
//   const { courseId, subsectionId, subSectionId } = req.body;
//   const targetSubId = subsectionId || subSectionId;
//   const userId = req.user.id;

//   if (!courseId || !targetSubId) {
//     return res.status(400).json({ success: false, error: "Course ID and Subsection ID are required." });
//   }

//   try {
//     const subsection = await prisma.subSection.findUnique({
//       where: { id: targetSubId },
//     });
//     if (!subsection) {
//       return res.status(404).json({ success: false, error: "Invalid subsection" });
//     }

//     let courseProgress = await prisma.courseProgress.findFirst({
//       where: {
//         courseID: courseId,
//         userId: userId,
//       },
//       include: {
//         completedVideos: true,
//       },
//     });

//     if (!courseProgress) {
//       courseProgress = await prisma.courseProgress.create({
//         data: {
//           courseID: courseId,
//           userId: userId,
//         },
//         include: {
//           completedVideos: true,
//         },
//       });
//     }

//     const isAlreadyCompleted = courseProgress.completedVideos?.some(
//       (v) => v.id === targetSubId
//     );

//     if (isAlreadyCompleted) {
//       return res.status(200).json({ success: true, message: "Subsection already completed" });
//     }

//     await prisma.courseProgress.update({
//       where: { id: courseProgress.id },
//       data: {
//         completedVideos: {
//           connect: { id: targetSubId },
//         },
//       },
//     });

//     return res.status(200).json({ success: true, message: "Course progress updated" });
//   } catch (error) {
//     console.error("UPDATE COURSE PROGRESS ERROR:", error);
//     return res.status(500).json({ success: false, error: error.message || "Internal server error" });
//   }
// };

// exports.getProgressPercentage = async (req, res) => {
//   const { courseId } = req.body;
//   const userId = req.user.id;

//   if (!courseId) {
//     return res.status(400).json({ error: "Course ID not provided." });
//   }

//   try {
//     const courseProgress = await prisma.courseProgress.findFirst({
//       where: {
//         courseID: courseId,
//         userId: userId,
//       },
//       include: {
//         completedVideos: true,
//         course: {
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

//     if (!courseProgress || !courseProgress.course) {
//       return res
//         .status(400)
//         .json({ error: "Can not find Course Progress with these IDs." });
//     }

//     let lectures = 0;
//     courseProgress.course.courseContent?.forEach((sec) => {
//       lectures += sec.subSection?.length || 0;
//     });

//     let progressPercentage = 0;
//     if (lectures > 0) {
//       progressPercentage = (courseProgress.completedVideos.length / lectures) * 100;
//       const multiplier = Math.pow(10, 2);
//       progressPercentage = Math.round(progressPercentage * multiplier) / multiplier;
//     }

//     return res.status(200).json({
//       data: progressPercentage,
//       message: "Succesfully fetched Course progress",
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };








const { prisma } = require("../config/database");

// 1. updateCourseProgress (Pure Raw Query - Fixed Junction Table)
exports.updateCourseProgress = async (req, res) => {
  const { courseId, subsectionId, subSectionId } = req.body;
  const targetSubId = subsectionId || subSectionId;
  const userId = req.user?.id;

  if (!courseId || !targetSubId) {
    return res.status(400).json({ success: false, error: "Course ID and Subsection ID are required." });
  }

  try {
    // Check if Subsection Exists
    const subsectionResult = await prisma.$queryRaw`
      SELECT id FROM "SubSection" WHERE id = ${targetSubId}
    `;

    if (!subsectionResult || subsectionResult.length === 0) {
      return res.status(404).json({ success: false, error: "Invalid subsection" });
    }

    // Find or Create Course Progress
    let progressResult = await prisma.$queryRaw`
      SELECT id FROM "CourseProgress"
      WHERE "courseID" = ${courseId} AND "userId" = ${userId}
      LIMIT 1
    `;

    let courseProgressId;

    if (!progressResult || progressResult.length === 0) {
      const newProgress = await prisma.$queryRaw`
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

    // Check if video is already completed in "_CompletedSubSections" junction table
    const isCompletedResult = await prisma.$queryRaw`
      SELECT * FROM "_CompletedSubSections"
      WHERE "A" = ${courseProgressId} AND "B" = ${targetSubId}
    `;

    if (isCompletedResult && isCompletedResult.length > 0) {
      return res.status(200).json({ success: true, message: "Subsection already completed" });
    }

    // Insert into Many-to-Many Junction Table "_CompletedSubSections"
    await prisma.$executeRaw`
      INSERT INTO "_CompletedSubSections" ("A", "B")
      VALUES (${courseProgressId}, ${targetSubId})
    `;

    return res.status(200).json({ success: true, message: "Course progress updated" });
  } catch (error) {
    console.error("UPDATE COURSE PROGRESS ERROR:", error);
    return res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
};

// 2. getProgressPercentage (Pure Raw Query - Fixed Junction Table)
exports.getProgressPercentage = async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user?.id;

  if (!courseId) {
    return res.status(400).json({ error: "Course ID not provided." });
  }

  try {
    // Count completed videos using "_CompletedSubSections"
    const progressResult = await prisma.$queryRaw`
      SELECT 
        cp.id,
        COUNT(cv."B")::int AS "completedCount"
      FROM "CourseProgress" cp
      LEFT JOIN "_CompletedSubSections" cv ON cv."A" = cp.id
      WHERE cp."courseID" = ${courseId} AND cp."userId" = ${userId}
      GROUP BY cp.id
    `;

    if (!progressResult || progressResult.length === 0) {
      return res.status(400).json({ error: "Can not find Course Progress with these IDs." });
    }

    const completedCount = Number(progressResult[0].completedCount) || 0;

    // Count Total Subsections/Lectures in this Course
    const lecturesResult = await prisma.$queryRaw`
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