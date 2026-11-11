const { db } = require("../config/database");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

// Helper function to fetch section with nested subSections
async function getSectionWithSubSections(sectionId) {
  const result = await db.$query`
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

// 1. Create a new sub-section  
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

    // Handle Optional Resource Upload (PDF, Slides, Code .zip, etc.)
    let resourceUrl = null;
    let resourceName = null;
    const resourceFile = req.files?.resource || req.files?.resourceFile;
    if (resourceFile) {
      const resourceUpload = await uploadImageToCloudinary(
        resourceFile,
        process.env.FOLDER_NAME
      );
      resourceUrl = resourceUpload.secure_url;
      resourceName = resourceFile.name || req.body.resourceName || "Lecture Resource";
    } else if (req.body.resourceUrl) {
      resourceUrl = req.body.resourceUrl;
      resourceName = req.body.resourceName || "Lecture Resource";
    }

    // Insert SubSection
    await db.$execute`
      INSERT INTO "SubSection" (
        id, title, "timeDuration", description, "videoUrl", "resourceUrl", "resourceName", "sectionId"
      )
      VALUES (
        gen_random_uuid()::text,
        ${title},
        ${timeDuration},
        ${description},
        ${uploadDetails.secure_url},
        ${resourceUrl},
        ${resourceName},
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

// 2. Update a sub-section  
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
    const subSectionResult = await db.$query`
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

    let updatedResourceUrl = subSection.resourceUrl;
    let updatedResourceName = subSection.resourceName;

    const resourceFile = req.files?.resource || req.files?.resourceFile;
    if (resourceFile) {
      const resourceUpload = await uploadImageToCloudinary(
        resourceFile,
        process.env.FOLDER_NAME
      );
      updatedResourceUrl = resourceUpload.secure_url;
      updatedResourceName = resourceFile.name || req.body.resourceName || "Lecture Resource";
    } else if (req.body.resourceUrl !== undefined) {
      updatedResourceUrl = req.body.resourceUrl || null;
      updatedResourceName = req.body.resourceName || null;
    }

    // Update SubSection
    await db.$execute`
      UPDATE "SubSection"
      SET 
        title = ${updatedTitle},
        description = ${updatedDescription},
        "videoUrl" = ${updatedVideoUrl},
        "timeDuration" = ${updatedTimeDuration},
        "resourceUrl" = ${updatedResourceUrl},
        "resourceName" = ${updatedResourceName}
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

// 3. Delete a sub-section  
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
    const subSectionResult = await db.$query`
      SELECT id FROM "SubSection" WHERE id = ${subSectionId}
    `;

    if (!subSectionResult || subSectionResult.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "SubSection not found" });
    }

    // Clean up CompletedSubSection Junction Table references if needed
    await db.$execute`
      DELETE FROM "CompletedSubSection" WHERE "subSectionId" = ${subSectionId}
    `.catch(() => {});

    // Delete SubSection
    await db.$execute`
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
