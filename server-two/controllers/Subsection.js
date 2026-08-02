// const { prisma } = require("../config/database");
// const { uploadImageToCloudinary } = require("../utils/imageUploader");

// // Create a new sub-section for a given section
// exports.createSubSection = async (req, res) => {
//   try {
//     const { sectionId, title, description } = req.body;
//     const video = req.files?.video;

//     if (!sectionId || !title || !description || !video) {
//       return res
//         .status(404)
//         .json({ success: false, message: "All Fields are Required" });
//     }

//     const uploadDetails = await uploadImageToCloudinary(
//       video,
//       process.env.FOLDER_NAME
//     );

//     await prisma.subSection.create({
//       data: {
//         title: title,
//         timeDuration: `${uploadDetails.duration}`,
//         description: description,
//         videoUrl: uploadDetails.secure_url,
//         sectionId: sectionId,
//       },
//     });

//     const updatedSection = await prisma.section.findUnique({
//       where: { id: sectionId },
//       include: {
//         subSection: true,
//       },
//     });

//     return res.status(200).json({ success: true, data: updatedSection });
//   } catch (error) {
//     console.error("Error creating new sub-section:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// exports.updateSubSection = async (req, res) => {
//   try {
//     const { sectionId, subSectionId, title, description } = req.body;
//     const subSection = await prisma.subSection.findUnique({
//       where: { id: subSectionId },
//     });

//     if (!subSection) {
//       return res.status(404).json({
//         success: false,
//         message: "SubSection not found",
//       });
//     }

//     const updateData = {};
//     if (title !== undefined) updateData.title = title;
//     if (description !== undefined) updateData.description = description;

//     if (req.files && req.files.video !== undefined) {
//       const video = req.files.video;
//       const uploadDetails = await uploadImageToCloudinary(
//         video,
//         process.env.FOLDER_NAME
//       );
//       updateData.videoUrl = uploadDetails.secure_url;
//       updateData.timeDuration = `${uploadDetails.duration}`;
//     }

//     await prisma.subSection.update({
//       where: { id: subSectionId },
//       data: updateData,
//     });

//     const updatedSection = await prisma.section.findUnique({
//       where: { id: sectionId },
//       include: {
//         subSection: true,
//       },
//     });

//     return res.json({
//       success: true,
//       message: "Section updated successfully",
//       data: updatedSection,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "An error occurred while updating the section",
//     });
//   }
// };

// exports.deleteSubSection = async (req, res) => {
//   try {
//     const { subSectionId, sectionId } = req.body;

//     const subSection = await prisma.subSection.findUnique({
//       where: { id: subSectionId },
//     });

//     if (!subSection) {
//       return res
//         .status(404)
//         .json({ success: false, message: "SubSection not found" });
//     }

//     await prisma.subSection.delete({
//       where: { id: subSectionId },
//     });

//     const updatedSection = await prisma.section.findUnique({
//       where: { id: sectionId },
//       include: {
//         subSection: true,
//       },
//     });

//     return res.json({
//       success: true,
//       message: "SubSection deleted successfully",
//       data: updatedSection,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "An error occurred while deleting the SubSection",
//     });
//   }
// };









const { prisma } = require("../config/database");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

// Helper function to fetch section with nested subSections
async function getSectionWithSubSections(sectionId) {
  const result = await prisma.$queryRaw`
    SELECT 
      sec.*,
      COALESCE(
        (
          SELECT json_agg(subsec.*)
          FROM "SubSection" subsec
          WHERE subsec."sectionId" = sec.id
        ),
        '[]'::json
      ) AS "subSection"
    FROM "Section" sec
    WHERE sec.id = ${sectionId}
  `;
  return result[0] || null;
}

// 1. Create a new sub-section (Pure Raw Query)
exports.createSubSection = async (req, res) => {
  try {
    const { sectionId, title, description } = req.body;
    const video = req.files?.video;

    if (!sectionId || !title || !description || !video) {
      return res
        .status(404)
        .json({ success: false, message: "All Fields are Required" });
    }

    const uploadDetails = await uploadImageToCloudinary(
      video,
      process.env.FOLDER_NAME
    );

    const timeDuration = uploadDetails.duration ? `${uploadDetails.duration}` : "0";

    // Insert SubSection
    await prisma.$executeRaw`
      INSERT INTO "SubSection" (
        id, title, "timeDuration", description, "videoUrl", "sectionId"
      )
      VALUES (
        gen_random_uuid()::text,
        ${title},
        ${timeDuration},
        ${description},
        ${uploadDetails.secure_url},
        ${sectionId}
      )
    `;

    // Fetch Updated Section
    const updatedSection = await getSectionWithSubSections(sectionId);

    return res.status(200).json({ success: true, data: updatedSection });
  } catch (error) {
    console.error("Error creating new sub-section:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// 2. Update a sub-section (Pure Raw Query)
exports.updateSubSection = async (req, res) => {
  try {
    const { sectionId, subSectionId, title, description } = req.body;

    if (!subSectionId) {
      return res.status(400).json({
        success: false,
        message: "SubSection ID is required",
      });
    }

    // Find SubSection
    const subSectionResult = await prisma.$queryRaw`
      SELECT * FROM "SubSection" WHERE id = ${subSectionId}
    `;

    const subSection = subSectionResult[0];

    if (!subSection) {
      return res.status(404).json({
        success: false,
        message: "SubSection not found",
      });
    }

    let updatedTitle = subSection.title;
    if (title !== undefined) updatedTitle = title;

    let updatedDescription = subSection.description;
    if (description !== undefined) updatedDescription = description;

    let updatedVideoUrl = subSection.videoUrl;
    let updatedTimeDuration = subSection.timeDuration;

    if (req.files && req.files.video !== undefined) {
      const video = req.files.video;
      const uploadDetails = await uploadImageToCloudinary(
        video,
        process.env.FOLDER_NAME
      );
      updatedVideoUrl = uploadDetails.secure_url;
      updatedTimeDuration = uploadDetails.duration ? `${uploadDetails.duration}` : "0";
    }

    // Update SubSection
    await prisma.$executeRaw`
      UPDATE "SubSection"
      SET 
        title = ${updatedTitle},
        description = ${updatedDescription},
        "videoUrl" = ${updatedVideoUrl},
        "timeDuration" = ${updatedTimeDuration}
      WHERE id = ${subSectionId}
    `;

    // Fetch Updated Section
    const updatedSection = await getSectionWithSubSections(sectionId);

    return res.json({
      success: true,
      message: "Section updated successfully",
      data: updatedSection,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the section",
    });
  }
};

// 3. Delete a sub-section (Pure Raw Query)
exports.deleteSubSection = async (req, res) => {
  try {
    const { subSectionId, sectionId } = req.body;

    if (!subSectionId) {
      return res.status(400).json({
        success: false,
        message: "SubSection ID is required",
      });
    }

    // Check if SubSection exists
    const subSectionResult = await prisma.$queryRaw`
      SELECT id FROM "SubSection" WHERE id = ${subSectionId}
    `;

    if (!subSectionResult || subSectionResult.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "SubSection not found" });
    }

    // Clean up _CompletedSubSections Junction Table references if needed
    await prisma.$executeRaw`
      DELETE FROM "_CompletedSubSections" WHERE "B" = ${subSectionId}
    `.catch(() => {});

    // Delete SubSection
    await prisma.$executeRaw`
      DELETE FROM "SubSection" WHERE id = ${subSectionId}
    `;

    // Fetch Updated Section
    const updatedSection = await getSectionWithSubSections(sectionId);

    return res.json({
      success: true,
      message: "SubSection deleted successfully",
      data: updatedSection,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the SubSection",
    });
  }
};