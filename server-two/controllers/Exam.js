const { db } = require("../config/database");
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
    const examId = require("crypto").randomUUID();

    // Insert Exam
    await db.$execute`
      INSERT INTO "Exam" (id, title, description, "examType", "totalMarks", "courseId", "sectionId", "subSectionId", "createdAt", "updatedAt")
      VALUES (
        ${examId},
        ${title},
        ${description || null},
        ${examType},
        ${parsedTotalMarks},
        ${courseId || null},
        ${sectionId || null},
        ${subSectionId || null},
        NOW(),
        NOW()
      )
    `;

    // Insert MCQ questions if provided
    if (examType === "MCQ" && questions && Array.isArray(questions)) {
      for (const q of questions) {
        const qId = require("crypto").randomUUID();
        await db.$execute`
          INSERT INTO "Question" (id, "examId", "questionText", options, "correctOption", "createdAt", "updatedAt")
          VALUES (
            ${qId},
            ${examId},
            ${q.questionText},
            ${q.options},
            ${String(q.correctOption)},
            NOW(),
            NOW()
          )
        `;
      }
    }

    // Fetch the created exam with its questions
    const examResult = await db.$query`
      SELECT * FROM "Exam" WHERE id = ${examId}
    `;
    const createdExam = examResult[0];

    if (createdExam) {
      const questionsResult = await db.$query`
        SELECT * FROM "Question" WHERE "examId" = ${examId}
      `;
      createdExam.questions = questionsResult;
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

    let exams = [];
    if (subSectionId) {
      exams = await db.$query`
        SELECT * FROM "Exam" WHERE "subSectionId" = ${subSectionId}
      `;
    } else if (sectionId) {
      exams = await db.$query`
        SELECT * FROM "Exam" WHERE "sectionId" = ${sectionId} AND "subSectionId" IS NULL
      `;
    } else if (courseId) {
      exams = await db.$query`
        SELECT * FROM "Exam" WHERE "courseId" = ${courseId} AND "sectionId" IS NULL AND "subSectionId" IS NULL
      `;
    } else {
      return res.status(400).json({
        success: false,
        message: "Target ID (courseId, sectionId, or subSectionId) is required.",
      });
    }

    // Include questions and submissions for student
    const studentId = req.user.id;
    for (const exam of exams) {
      const questions = await db.$query`
        SELECT * FROM "Question" WHERE "examId" = ${exam.id}
      `;
      exam.questions = questions;

      const submissions = await db.$query`
        SELECT * FROM "ExamSubmission" WHERE "examId" = ${exam.id} AND "studentId" = ${studentId}
      `;
      exam.submissions = submissions;
    }

    // Anti-cheat
    const isStudent = req.user.accountType === "Student";
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
    const existingSubmissionResult = await db.$query`
      SELECT * FROM "ExamSubmission" WHERE "examId" = ${examId} AND "studentId" = ${studentId}
    `;

    if (existingSubmissionResult && existingSubmissionResult.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted this exam.",
      });
    }

    const examResult = await db.$query`
      SELECT * FROM "Exam" WHERE id = ${examId}
    `;
    const exam = examResult[0];

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

      const questions = await db.$query`
        SELECT * FROM "Question" WHERE "examId" = ${examId}
      `;

      let correctCount = 0;
      const parsedAnswers = typeof answers === "string" ? JSON.parse(answers) : answers;

      questions.forEach((q) => {
        const studentAns = String(parsedAnswers[q.id] || "").trim().toLowerCase();
        const correctAns = String(q.correctOption || "").trim().toLowerCase();
        if (studentAns === correctAns) {
          correctCount++;
        }
      });

      const obtainedMarks = questions.length > 0
        ? (correctCount / questions.length) * exam.totalMarks
        : 0;

      const status = obtainedMarks >= (exam.totalMarks * 0.5) ? "PASSED" : "FAILED";
      const submissionId = require("crypto").randomUUID();

      await db.$execute`
        INSERT INTO "ExamSubmission" (id, "examId", "studentId", "obtainedMarks", answers, status, "createdAt", "updatedAt")
        VALUES (
          ${submissionId},
          ${examId},
          ${studentId},
          ${obtainedMarks},
          ${JSON.stringify(parsedAnswers)},
          ${status},
          NOW(),
          NOW()
        )
      `;

      const submissionResult = await db.$query`
        SELECT * FROM "ExamSubmission" WHERE id = ${submissionId}
      `;
      const submission = submissionResult[0];
      if (submission) {
        submission.exam = exam;
        submission.exam.questions = questions;
      }

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

      const submissionId = require("crypto").randomUUID();
      await db.$execute`
        INSERT INTO "ExamSubmission" (id, "examId", "studentId", "submissionUrl", status, "createdAt", "updatedAt")
        VALUES (
          ${submissionId},
          ${examId},
          ${studentId},
          ${submissionUrl},
          'PENDING',
          NOW(),
          NOW()
        )
      `;

      const submissionResult = await db.$query`
        SELECT * FROM "ExamSubmission" WHERE id = ${submissionId}
      `;
      const submission = submissionResult[0];

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

    const submissions = await db.$query`
      SELECT 
        s.*,
        json_build_object(
          'id', u.id,
          'firstName', u."firstName",
          'lastName', u."lastName",
          'email', u.email,
          'image', u.image
        ) AS student,
        json_build_object(
          'id', e.id,
          'title', e.title,
          'examType', e."examType",
          'totalMarks', e."totalMarks"
        ) AS exam
      FROM "ExamSubmission" s
      JOIN "User" u ON s."studentId" = u.id
      JOIN "Exam" e ON s."examId" = e.id
      WHERE s."examId" = ${examId}
      ORDER BY s."createdAt" DESC
    `;

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

    const nextStatus = status || "PASSED";

    await db.$execute`
      UPDATE "ExamSubmission"
      SET "obtainedMarks" = ${parsedObtained},
          feedback = ${feedback || null},
          status = ${nextStatus},
          "updatedAt" = NOW()
      WHERE id = ${submissionId}
    `;

    const updatedSubResult = await db.$query`
      SELECT 
        s.*,
        json_build_object(
          'id', u.id,
          'firstName', u."firstName",
          'lastName', u."lastName",
          'email', u.email
        ) AS student,
        json_build_object(
          'id', e.id,
          'title', e.title,
          'examType', e."examType",
          'totalMarks', e."totalMarks"
        ) AS exam
      FROM "ExamSubmission" s
      JOIN "User" u ON s."studentId" = u.id
      JOIN "Exam" e ON s."examId" = e.id
      WHERE s.id = ${submissionId}
    `;

    return res.status(200).json({
      success: true,
      message: "Submission graded successfully",
      data: updatedSubResult[0],
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

    // 1. Get all courses enrolled by the student
    const enrolledCourses = await db.$query`
      SELECT c.id, c."courseName"
      FROM "Course" c
      JOIN "_EnrolledStudents" es ON es."A" = c.id
      WHERE es."B" = ${studentId}
    `;

    const examsList = [];

    for (const course of enrolledCourses) {
      // 1. Course-level exams
      const courseExams = await db.$query`
        SELECT * FROM "Exam" 
        WHERE "courseId" = ${course.id} AND "sectionId" IS NULL AND "subSectionId" IS NULL
      `;
      courseExams.forEach((exam) => {
        examsList.push({
          ...exam,
          courseName: course.courseName,
          level: "Course Final",
        });
      });

      // Get sections for course content
      const sections = await db.$query`
        SELECT id, "sectionName" FROM "Section" WHERE "courseId" = ${course.id}
      `;

      for (const section of sections) {
        // 2. Section-level exams
        const sectionExams = await db.$query`
          SELECT * FROM "Exam"
          WHERE "sectionId" = ${section.id} AND "subSectionId" IS NULL
        `;
        sectionExams.forEach((exam) => {
          examsList.push({
            ...exam,
            courseName: course.courseName,
            level: `Section: ${section.sectionName}`,
          });
        });

        // Get subsections/lectures
        const subSections = await db.$query`
          SELECT id, title FROM "SubSection" WHERE "sectionId" = ${section.id}
        `;

        for (const sub of subSections) {
          // 3. SubSection-level exams
          const subExams = await db.$query`
            SELECT * FROM "Exam"
            WHERE "subSectionId" = ${sub.id}
          `;
          subExams.forEach((exam) => {
            examsList.push({
              ...exam,
              courseName: course.courseName,
              level: `Lecture: ${sub.title}`,
            });
          });
        }
      }
    }

    if (examsList.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Populate questions for each exam
    for (const exam of examsList) {
      const questions = await db.$query`
        SELECT * FROM "Question" WHERE "examId" = ${exam.id}
      `;
      exam.questions = questions;
    }

    // Fetch submissions of this student for these exams
    const examIds = examsList.map((e) => e.id);
    const submissions = await db.$query`
      SELECT * FROM "ExamSubmission"
      WHERE "studentId" = ${studentId} AND "examId" = ANY(${examIds})
    `;

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
