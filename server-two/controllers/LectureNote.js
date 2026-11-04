const { db } = require("../config/database");

// 1. Get note for a specific lecture (subSection)
exports.getLectureNote = async (req, res) => {
  try {
    const userId = req.user.id;
    const subSectionId = req.query.subSectionId || req.params.subSectionId;

    if (!subSectionId) {
      return res.status(400).json({ success: false, message: "subSectionId is required" });
    }

    const result = await db.$query`
      SELECT notes, "updatedAt"
      FROM "LectureNote"
      WHERE "userId" = ${userId} AND "subSectionId" = ${subSectionId}
      LIMIT 1
    `;

    return res.status(200).json({
      success: true,
      notes: result[0]?.notes || "",
      updatedAt: result[0]?.updatedAt || null,
    });
  } catch (error) {
    console.error("GET LECTURE NOTE ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch note" });
  }
};

// 2. Save or update note for a specific lecture
exports.saveLectureNote = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subSectionId, notes } = req.body;

    if (!subSectionId) {
      return res.status(400).json({ success: false, message: "subSectionId is required" });
    }

    const noteContent = notes || "";

    await db.$execute`
      INSERT INTO "LectureNote" ("id", "userId", "subSectionId", "notes", "updatedAt")
      VALUES (gen_random_uuid()::text, ${userId}, ${subSectionId}, ${noteContent}, NOW())
      ON CONFLICT ("userId", "subSectionId")
      DO UPDATE SET "notes" = ${noteContent}, "updatedAt" = NOW()
    `;

    return res.status(200).json({
      success: true,
      message: "Notes saved successfully!",
      notes: noteContent,
    });
  } catch (error) {
    console.error("SAVE LECTURE NOTE ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to save note" });
  }
};

