const { prisma } = require("../config/database");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

// 1. Create a new exam (Instructor only)
exports.createExam = async (req, res) => {
  try {
    const {
      title,
      description,
      examType,
      totalMarks,
      courseId,
      sectionId,
      subSectionId,
      questions,
    } = req.body;

    if (!title || !examType) {
      return res.status(400).json({
        success: false,
        message: "Title and Exam Type are required fields.",
      });
    }

    if (!courseId && !sectionId && !subSectionId) {
      return res.status(400).json({
        success: false,
        message: "Exam must be linked to a Course, Section, or SubSection.",
      });
    }

    const parsedTotalMarks = parseFloat(totalMarks) || 100;

    const examData = {
      title,
      description,
      examType,
      totalMarks: parsedTotalMarks,
    };

    if (courseId) examData.courseId = courseId;
    if (sectionId) examData.sectionId = sectionId;
    if (subSectionId) examData.subSectionId = subSectionId;

    let createdExam;

    if (examType === "MCQ" && questions && Array.isArray(questions)) {
      createdExam = await prisma.exam.create({
        data: {
          ...examData,
          questions: {
            create: questions.map((q) => ({
              questionText: q.questionText,
              options: q.options,
              correctOption: q.correctOption,
            })),
          },
        },
        include: {
          questions: true,
        },
      });
    } else {
      createdExam = await prisma.exam.create({
        data: examData,
        include: {
          questions: true,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: "Exam created successfully",
      data: createdExam,
    });
  } catch (error) {
    console.error("Error in createExam:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating exam.",
      error: error.message,
    });
  }
};

// 2. Get exam by target id (Course, Section, or SubSection)
exports.getExamByTarget = async (req, res) => {
  try {
    const { courseId, sectionId, subSectionId } = req.query;

    const where = {};
    if (subSectionId) {
      where.subSectionId = subSectionId;
    } else if (sectionId) {
      where.sectionId = sectionId;
      where.subSectionId = null;
    } else if (courseId) {
      where.courseId = courseId;
      where.sectionId = null;
      where.subSectionId = null;
    } else {
      return res.status(400).json({
        success: false,
        message: "Target ID (courseId, sectionId, or subSectionId) is required.",
      });
    }

    const exams = await prisma.exam.findMany({
      where,
      include: {
        questions: true,
        submissions: {
          where: {
            studentId: req.user.id,
          },
        },
      },
    });

    // Anti-cheat: strip correctOption from questions if requester is a Student and hasn't submitted yet
    const isStudent = req.user.accountType === "Student" || req.user.role === "Student";
    const processedExams = exams.map((exam) => {
      const hasSubmitted = exam.submissions && exam.submissions.length > 0;
      if (isStudent && !hasSubmitted) {
        return {
          ...exam,
          questions: exam.questions.map((q) => {
            const { correctOption, ...rest } = q;
            return rest;
          }),
        };
      }
      return exam;
    });

    return res.status(200).json({
      success: true,
      data: processedExams,
    });
  } catch (error) {
    console.error("Error in getExamByTarget:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching exams.",
      error: error.message,
    });
  }
};

// 3. Submit an exam submission (Student only)
exports.submitExam = async (req, res) => {
  try {
    const { examId, answers } = req.body;
    const studentId = req.user.id;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Exam ID is required.",
      });
    }

    // Check for unique submission
    const existingSubmission = await prisma.examSubmission.findUnique({
      where: {
        examId_studentId: {
          examId,
          studentId,
        },
      },
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted this exam.",
      });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: true },
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    if (exam.examType === "MCQ") {
      if (!answers) {
        return res.status(400).json({
          success: false,
          message: "Answers are required for MCQ exams.",
        });
      }

      let correctCount = 0;
      const parsedAnswers = typeof answers === "string" ? JSON.parse(answers) : answers;

      exam.questions.forEach((q) => {
        const studentAns = String(parsedAnswers[q.id] || "").trim().toLowerCase();
        const correctAns = String(q.correctOption || "").trim().toLowerCase();
        if (studentAns === correctAns) {
          correctCount++;
        }
      });

      const obtainedMarks = exam.questions.length > 0
        ? (correctCount / exam.questions.length) * exam.totalMarks
        : 0;

      // Status: Pass threshold at 50%
      const status = obtainedMarks >= (exam.totalMarks * 0.5) ? "PASSED" : "FAILED";

      const submission = await prisma.examSubmission.create({
        data: {
          examId,
          studentId,
          obtainedMarks,
          answers: parsedAnswers,
          status,
        },
        include: {
          exam: {
            include: {
              questions: true,
            },
          },
        },
      });

      return res.status(201).json({
        success: true,
        message: "MCQ Exam submitted successfully.",
        data: submission,
      });
    } else {
      // WRITTEN Exam
      let submissionUrl = req.body.submissionUrl;

      if (req.files && req.files.submissionFile) {
        const file = req.files.submissionFile;
        const uploadDetails = await uploadImageToCloudinary(
          file,
          process.env.FOLDER_NAME || "StudyNotion"
        );
        submissionUrl = uploadDetails.secure_url;
      }

      if (!submissionUrl) {
        return res.status(400).json({
          success: false,
          message: "A submission PDF/image file or URL is required for written exams.",
        });
      }

      const submission = await prisma.examSubmission.create({
        data: {
          examId,
          studentId,
          submissionUrl,
          status: "PENDING",
        },
      });

      return res.status(201).json({
        success: true,
        message: "Written exam submitted successfully.",
        data: submission,
      });
    }
  } catch (error) {
    console.error("Error in submitExam:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while submitting exam.",
      error: error.message,
    });
  }
};

// 4. Get submissions for a specific exam (Instructor only)
exports.getSubmissionsByExam = async (req, res) => {
  try {
    const { examId } = req.query;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "examId query parameter is required.",
      });
    }

    const submissions = await prisma.examSubmission.findMany({
      where: { examId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },
        exam: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    console.error("Error in getSubmissionsByExam:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while retrieving submissions.",
      error: error.message,
    });
  }
};

// 5. Grade written submission (Instructor only)
exports.gradeSubmission = async (req, res) => {
  try {
    const { submissionId, obtainedMarks, feedback, status } = req.body;

    if (!submissionId) {
      return res.status(400).json({
        success: false,
        message: "Submission ID is required.",
      });
    }

    const parsedObtained = parseFloat(obtainedMarks);
    if (isNaN(parsedObtained)) {
      return res.status(400).json({
        success: false,
        message: "Obtained marks must be a valid number.",
      });
    }

    const updatedSubmission = await prisma.examSubmission.update({
      where: { id: submissionId },
      data: {
        obtainedMarks: parsedObtained,
        feedback,
        status: status || "PASSED",
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        exam: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Submission graded successfully",
      data: updatedSubmission,
    });
  } catch (error) {
    console.error("Error in gradeSubmission:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while grading submission.",
      error: error.message,
    });
  }
};

// 6. Get all available exams for a student based on enrolled courses
exports.getStudentExams = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Find student and include enrolled courses with nested exams
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        courses: {
          include: {
            exams: {
              include: {
                questions: true,
              },
            },
            courseContent: {
              include: {
                exams: {
                  include: {
                    questions: true,
                  },
                },
                subSection: {
                  include: {
                    exams: {
                      include: {
                        questions: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    const examsList = [];

    student.courses.forEach((course) => {
      // 1. Course-level exams (where sectionId is null and subSectionId is null)
      if (course.exams) {
        course.exams.forEach((exam) => {
          if (!exam.sectionId && !exam.subSectionId) {
            examsList.push({
              ...exam,
              courseName: course.courseName,
              level: "Course Final",
            });
          }
        });
      }

      // 2. Section-level exams (where sectionId is set but subSectionId is null)
      if (course.courseContent) {
        course.courseContent.forEach((section) => {
          if (section.exams) {
            section.exams.forEach((exam) => {
              if (exam.sectionId && !exam.subSectionId) {
                examsList.push({
                  ...exam,
                  courseName: course.courseName,
                  level: `Section: ${section.sectionName}`,
                });
              }
            });
          }

          // 3. SubSection-level exams (where subSectionId is set)
          if (section.subSection) {
            section.subSection.forEach((sub) => {
              if (sub.exams) {
                sub.exams.forEach((exam) => {
                  if (exam.subSectionId) {
                    examsList.push({
                      ...exam,
                      courseName: course.courseName,
                      level: `Lecture: ${sub.title}`,
                    });
                  }
                });
              }
            });
          }
        });
      }
    });

    // Fetch submissions of this student for these exams
    const submissions = await prisma.examSubmission.findMany({
      where: {
        studentId,
        examId: {
          in: examsList.map((e) => e.id),
        },
      },
    });

    // Combine exams with student submissions
    const result = examsList.map((exam) => {
      const submission = submissions.find((sub) => sub.examId === exam.id);

      // Anti-cheat: strip correctOption for unanswered MCQ exams
      const questions = exam.questions
        ? exam.questions.map((q) => {
            if (!submission) {
              const { correctOption, ...rest } = q;
              return rest;
            }
            return q;
          })
        : [];

      return {
        ...exam,
        questions,
        submission: submission || null,
      };
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in getStudentExams:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching student exams.",
      error: error.message,
    });
  }
};
