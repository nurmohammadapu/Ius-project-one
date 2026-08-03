const { db } = require("../config/database");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

// 1. POST /api/v1/course/quiz/create (Instructor)
exports.createQuiz = async (req, res) => {
    try {
        const {
            quizId, // If editing
            title,
            description,
            quizType, // 'SUBSECTION', 'SECTION', 'COURSE_FINAL'
            submissionType = "MCQ", // 'MCQ', 'FILE_UPLOAD', 'BOTH'
            totalMarks = 10,
            passMarks = 5,
            timeLimitMinutes = 10,
            dueDate,
            publishDate,
            courseId,
            sectionId,
            subSectionId,
            questions = [],
        } = req.body;

        if (!title || !quizType) {
            return res.status(400).json({
                success: false,
                message: "Title and quizType are required.",
            });
        }

        // Lock editing if quiz is already published
        if (quizId) {
            const existingQuiz = await db.$query`SELECT "publishDate", "isPublished" FROM "Quiz" WHERE id = ${quizId}`;
            if (existingQuiz && existingQuiz.length > 0) {
                const q = existingQuiz[0];
                const now = new Date();
                const isNowPublished = q.isPublished || (q.publishDate && now >= new Date(q.publishDate));
                if (isNowPublished) {
                    return res.status(403).json({
                        success: false,
                        message: "Published exams cannot be edited. You can only view them.",
                    });
                }
            }
        }

        let questionFileUrl = null;
        if (req.files && req.files.questionFile) {
            const uploadDetails = await uploadImageToCloudinary(
                req.files.questionFile,
                process.env.FOLDER_NAME
            );
            questionFileUrl = uploadDetails.secure_url;
        } else if (req.body.questionFileUrl) {
            questionFileUrl = req.body.questionFileUrl;
        }

        const now = new Date();
        const pDate = publishDate ? new Date(publishDate) : null;
        const isPublishedNow = pDate ? now >= pDate : true; // Published immediately if no schedule set

        let newQuiz;
        if (quizId) {
            // Update existing draft quiz
            const updateResult = await db.$query`
                UPDATE "Quiz"
                SET 
                    title = ${title},
                    description = ${description || null},
                    "submissionType" = ${submissionType}::"ExamSubmissionType",
                    "questionFileUrl" = COALESCE(${questionFileUrl}, "questionFileUrl"),
                    "totalMarks" = ${parseInt(totalMarks)},
                    "passMarks" = ${parseInt(passMarks)},
                    "timeLimitMinutes" = ${timeLimitMinutes ? parseInt(timeLimitMinutes) : null},
                    "dueDate" = ${dueDate ? new Date(dueDate) : null},
                    "publishDate" = ${pDate},
                    "isPublished" = ${isPublishedNow}
                WHERE id = ${quizId}
                RETURNING *
            `;
            newQuiz = updateResult[0];

            // Replace questions
            await db.$execute`DELETE FROM "Question" WHERE "quizId" = ${quizId}`;
        } else {
            // Insert Quiz record
            const quizResult = await db.$query`
                INSERT INTO "Quiz" (
                    title, description, "quizType", "submissionType", "questionFileUrl",
                    "totalMarks", "passMarks", "timeLimitMinutes", "dueDate", "publishDate", "isPublished",
                    "courseId", "sectionId", "subSectionId"
                )
                VALUES (
                    ${title}, ${description || null}, ${quizType}::"QuizType", ${submissionType}::"ExamSubmissionType", ${questionFileUrl},
                    ${parseInt(totalMarks)}, ${parseInt(passMarks)}, ${timeLimitMinutes ? parseInt(timeLimitMinutes) : null}, ${dueDate ? new Date(dueDate) : null}, ${pDate}, ${isPublishedNow},
                    ${courseId || null}, ${sectionId || null}, ${subSectionId || null}
                )
                RETURNING *
            `;
            newQuiz = quizResult[0];
        }

        // Parse questions if passed as JSON string
        let parsedQuestions = questions;
        if (typeof questions === "string") {
            try {
                parsedQuestions = JSON.parse(questions);
            } catch (e) {
                parsedQuestions = [];
            }
        }

        // Insert MCQ questions if provided
        if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
            for (const q of parsedQuestions) {
                if (q.questionText && q.optionA && q.optionB && q.optionC && q.optionD && q.correctAnswer) {
                    await db.$execute`
                        INSERT INTO "Question" (
                            "quizId", "questionText", "optionA", "optionB", "optionC", "optionD", "correctAnswer", marks
                        )
                        VALUES (
                            ${newQuiz.id}, ${q.questionText}, ${q.optionA}, ${q.optionB}, ${q.optionC}, ${q.optionD}, ${q.correctAnswer}, ${q.marks ? parseInt(q.marks) : 1}
                        )
                    `;
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: "Quiz saved successfully",
            data: newQuiz,
        });
    } catch (error) {
        console.error("CREATE/UPDATE QUIZ ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to save quiz",
            error: error.message,
        });
    }
};

// 2. GET /api/v1/course/quiz/get/:type/:id (Student & Instructor)
exports.getQuiz = async (req, res) => {
    try {
        const { type, id } = req.params; // type: 'SUBSECTION'|'SECTION'|'COURSE_FINAL', id: target ID

        let quizQuery;
        if (type === "SUBSECTION") {
            quizQuery = await db.$query`SELECT * FROM "Quiz" WHERE "subSectionId" = ${id} ORDER BY "createdAt" DESC LIMIT 1`;
        } else if (type === "SECTION") {
            quizQuery = await db.$query`SELECT * FROM "Quiz" WHERE "sectionId" = ${id} ORDER BY "createdAt" DESC LIMIT 1`;
        } else {
            quizQuery = await db.$query`SELECT * FROM "Quiz" WHERE "courseId" = ${id} AND "quizType" = 'COURSE_FINAL'::"QuizType" ORDER BY "createdAt" DESC LIMIT 1`;
        }

        if (!quizQuery || quizQuery.length === 0) {
            return res.status(200).json({
                success: true,
                hasQuiz: false,
                quiz: null,
            });
        }

        const quiz = quizQuery[0];
        const now = new Date();
        const isInstructorUser = req.user?.role === "Instructor" || req.user?.accountType === "Instructor";

        // Check Publish status for Students
        const isAvailableNow = quiz.isPublished || (quiz.publishDate && now >= new Date(quiz.publishDate));
        
        if (!isAvailableNow && !isInstructorUser) {
            return res.status(200).json({
                success: true,
                hasQuiz: true,
                isUpcoming: true,
                publishDate: quiz.publishDate,
                message: `Exam will be published on ${new Date(quiz.publishDate).toLocaleString()}`,
                quiz: null,
            });
        }

        // Fetch Questions (hiding correctAnswer for students)
        let rawQuestions;
        if (isInstructorUser) {
            rawQuestions = await db.$query`
                SELECT id, "quizId", "questionText", "optionA", "optionB", "optionC", "optionD", "correctAnswer", marks
                FROM "Question"
                WHERE "quizId" = ${quiz.id}
            `;
        } else {
            rawQuestions = await db.$query`
                SELECT id, "quizId", "questionText", "optionA", "optionB", "optionC", "optionD", marks
                FROM "Question"
                WHERE "quizId" = ${quiz.id}
            `;
        }

        // Check if student has previous submission
        let userResult = null;
        if (req.user?.id) {
            const existing = await db.$query`
                SELECT * FROM "QuizResult"
                WHERE "quizId" = ${quiz.id} AND "userId" = ${req.user.id}
            `;
            if (existing && existing.length > 0) {
                userResult = existing[0];
            }
        }

        const isExpired = quiz.dueDate && now > new Date(quiz.dueDate);

        return res.status(200).json({
            success: true,
            hasQuiz: true,
            isPublished: isAvailableNow,
            isExpired,
            quiz: {
                ...quiz,
                questions: rawQuestions,
            },
            userResult,
        });
    } catch (error) {
        console.error("GET QUIZ ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch quiz",
            error: error.message,
        });
    }
};

// 3. POST /api/v1/course/quiz/submit (Student)
exports.submitQuiz = async (req, res) => {
    try {
        const userId = req.user.id;
        const { quizId, answersJson } = req.body;

        const quizList = await db.$query`SELECT * FROM "Quiz" WHERE id = ${quizId}`;
        if (!quizList || quizList.length === 0) {
            return res.status(404).json({ success: false, message: "Quiz not found" });
        }
        const quiz = quizList[0];
        const now = new Date();

        // Enforce Deadline Check: If deadline passed, reject submission (Student gets 0 / absent)
        if (quiz.dueDate && now > new Date(quiz.dueDate)) {
            return res.status(400).json({
                success: false,
                isExpired: true,
                message: "Exam deadline has passed! Submissions are no longer accepted.",
            });
        }

        let submissionUrl = null;
        if (req.files && req.files.submissionFile) {
            const uploadDetails = await uploadImageToCloudinary(
                req.files.submissionFile,
                process.env.FOLDER_NAME
            );
            submissionUrl = uploadDetails.secure_url;
        } else if (req.body.submissionUrl) {
            submissionUrl = req.body.submissionUrl;
        }

        let score = null;
        let isPassed = null;
        let status = "PENDING";

        // Auto-grade MCQ if answers are submitted
        if (answersJson) {
            let parsedAnswers = typeof answersJson === "string" ? JSON.parse(answersJson) : answersJson;
            const dbQuestions = await db.$query`SELECT id, "correctAnswer", marks FROM "Question" WHERE "quizId" = ${quizId}`;
            
            let calculatedScore = 0;
            dbQuestions.forEach((q) => {
                const studentAns = parsedAnswers[q.id];
                if (studentAns && studentAns === q.correctAnswer) {
                    calculatedScore += (q.marks || 1);
                }
            });

            score = calculatedScore;
            isPassed = score >= quiz.passMarks;
            status = quiz.submissionType === "MCQ" ? "GRADED" : "PENDING";
        }

        // Save result with ON CONFLICT update
        const savedResult = await db.$query`
            INSERT INTO "QuizResult" (
                "quizId", "userId", "answersJson", "submissionUrl", score, "isPassed", status, "submittedAt"
            )
            VALUES (
                ${quizId}, ${userId}, ${answersJson ? JSON.stringify(answersJson) : null}::jsonb, ${submissionUrl}, ${score}, ${isPassed}, ${status}, NOW()
            )
            ON CONFLICT ("quizId", "userId")
            DO UPDATE SET
                "answersJson" = EXCLUDED."answersJson",
                "submissionUrl" = COALESCE(EXCLUDED."submissionUrl", "QuizResult"."submissionUrl"),
                score = COALESCE(EXCLUDED.score, "QuizResult".score),
                "isPassed" = COALESCE(EXCLUDED."isPassed", "QuizResult"."isPassed"),
                status = EXCLUDED.status,
                "submittedAt" = NOW()
            RETURNING *
        `;

        return res.status(200).json({
            success: true,
            message: "Submission successful",
            data: savedResult[0],
        });
    } catch (error) {
        console.error("SUBMIT QUIZ ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to submit quiz",
            error: error.message,
        });
    }
};

// 4. POST /api/v1/course/quiz/instructor/grade (Instructor Only)
exports.gradeQuiz = async (req, res) => {
    try {
        const { quizId, userId, score, feedback } = req.body;

        if (!quizId || !userId || score === undefined) {
            return res.status(400).json({
                success: false,
                message: "quizId, userId, and score are required.",
            });
        }

        const quizList = await db.$query`SELECT "passMarks" FROM "Quiz" WHERE id = ${quizId}`;
        if (!quizList || quizList.length === 0) {
            return res.status(404).json({ success: false, message: "Quiz not found" });
        }
        const passMarks = quizList[0].passMarks;
        const isPassed = parseInt(score) >= passMarks;

        const updatedResult = await db.$query`
            UPDATE "QuizResult"
            SET 
                score = ${parseInt(score)},
                feedback = ${feedback || null},
                "isPassed" = ${isPassed},
                status = 'GRADED'
            WHERE "quizId" = ${quizId} AND "userId" = ${userId}
            RETURNING *
        `;

        return res.status(200).json({
            success: true,
            message: "Grade updated successfully",
            data: updatedResult[0],
        });
    } catch (error) {
        console.error("GRADE QUIZ ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to grade quiz",
            error: error.message,
        });
    }
};

// 5. GET /api/v1/course/quiz/instructor/results/:quizId (Instructor Only)
exports.getQuizResults = async (req, res) => {
    try {
        const { quizId } = req.params;

        const results = await db.$query`
            SELECT 
                qr.*,
                u."firstName",
                u."lastName",
                u.email,
                u.image
            FROM "QuizResult" qr
            JOIN "User" u ON qr."userId" = u.id
            WHERE qr."quizId" = ${quizId}
            ORDER BY qr."submittedAt" DESC
        `;

        return res.status(200).json({
            success: true,
            data: results,
        });
    } catch (error) {
        console.error("GET QUIZ RESULTS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch quiz results",
            error: error.message,
        });
    }
};
