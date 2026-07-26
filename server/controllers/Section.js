const { prisma } = require("../config/database");

// CREATE a new section
exports.createSection = async (req, res) => {
  try {
    const { sectionName, courseId } = req.body;

    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Missing required properties",
      });
    }

    const newSection = await prisma.section.create({
      data: {
        sectionName,
        courseId,
      },
    });

    const updatedCourse = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        courseContent: {
          include: {
            subSection: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Section created successfully",
      updatedCourse,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// UPDATE a section
exports.updateSection = async (req, res) => {
  try {
    const { sectionName, sectionId, courseId } = req.body;

    const section = await prisma.section.update({
      where: { id: sectionId },
      data: { sectionName },
    });

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        courseContent: {
          include: {
            subSection: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: section,
      data: course,
    });
  } catch (error) {
    console.error("Error updating section:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// DELETE a section
exports.deleteSection = async (req, res) => {
  try {
    const { sectionId, courseId } = req.body;

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    await prisma.section.delete({
      where: { id: sectionId },
    });

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        courseContent: {
          include: {
            subSection: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Section deleted",
      data: course,
    });
  } catch (error) {
    console.error("Error deleting section:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
