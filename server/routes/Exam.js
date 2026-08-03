const express = require("express");
const router = express.Router();

const {
  createExam,
  getExamByTarget,
  submitExam,
  getSubmissionsByExam,
  gradeSubmission,
  getStudentExams,
} = require("../controllers/Exam");

const { auth, isInstructor, isStudent } = require("../middlewares/auth");

router.post("/createExam", auth, isInstructor, createExam);
router.get("/getExamByTarget", auth, getExamByTarget);
router.post("/submitExam", auth, isStudent, submitExam);
router.get("/getSubmissionsByExam", auth, isInstructor, getSubmissionsByExam);
router.post("/gradeSubmission", auth, isInstructor, gradeSubmission);
router.get("/getStudentExams", auth, isStudent, getStudentExams);

module.exports = router;
