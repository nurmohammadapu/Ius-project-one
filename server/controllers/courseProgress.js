const { prisma } = require("../config/database");

exports.updateCourseProgress = async (req, res) => {
  const { courseId, subsectionId, subSectionId } = req.body;
  const targetSubId = subsectionId || subSectionId;
  const userId = req.user.id;

  if (!courseId || !targetSubId) {
    return res.status(400).json({ success: false, error: "Course ID and Subsection ID are required." });
  }

  try {
    const subsection = await prisma.subSection.findUnique({
      where: { id: targetSubId },
    });
    if (!subsection) {
      return res.status(404).json({ success: false, error: "Invalid subsection" });
    }

    let courseProgress = await prisma.courseProgress.findFirst({
      where: {
        courseID: courseId,
        userId: userId,
      },
      include: {
        completedVideos: true,
      },
    });

    if (!courseProgress) {
      courseProgress = await prisma.courseProgress.create({
        data: {
          courseID: courseId,
          userId: userId,
        },
        include: {
          completedVideos: true,
        },
      });
    }

    const isAlreadyCompleted = courseProgress.completedVideos?.some(
      (v) => v.id === targetSubId
    );

    if (isAlreadyCompleted) {
      return res.status(200).json({ success: true, message: "Subsection already completed" });
    }

    await prisma.courseProgress.update({
      where: { id: courseProgress.id },
      data: {
        completedVideos: {
          connect: { id: targetSubId },
        },
      },
    });

    return res.status(200).json({ success: true, message: "Course progress updated" });
  } catch (error) {
    console.error("UPDATE COURSE PROGRESS ERROR:", error);
    return res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
};

exports.getProgressPercentage = async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user.id;

  if (!courseId) {
    return res.status(400).json({ error: "Course ID not provided." });
  }

  try {
    const courseProgress = await prisma.courseProgress.findFirst({
      where: {
        courseID: courseId,
        userId: userId,
      },
      include: {
        completedVideos: true,
        course: {
          include: {
            courseContent: {
              include: {
                subSection: true,
              },
            },
          },
        },
      },
    });

    if (!courseProgress || !courseProgress.course) {
      return res
        .status(400)
        .json({ error: "Can not find Course Progress with these IDs." });
    }

    let lectures = 0;
    courseProgress.course.courseContent?.forEach((sec) => {
      lectures += sec.subSection?.length || 0;
    });

    let progressPercentage = 0;
    if (lectures > 0) {
      progressPercentage = (courseProgress.completedVideos.length / lectures) * 100;
      const multiplier = Math.pow(10, 2);
      progressPercentage = Math.round(progressPercentage * multiplier) / multiplier;
    }

    return res.status(200).json({
      data: progressPercentage,
      message: "Succesfully fetched Course progress",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
