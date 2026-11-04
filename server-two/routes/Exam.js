const createHttpApp = require("../httpHelper");
const router = createHttpApp.Router();

const {
  createExam,
  getExamByTarget,
  submitExam,
  getSubmissionsByExam,
  gradeSubmission,
  getStudentExams,
  getExamLeaderboard,
  getInstructorExams,
  getAllExamsAdmin,
} = require("../controllers/Exam");

const { auth, isInstructor, isStudent, isAdmin } = require("../middlewares/auth");

router.post("/createExam", auth, isInstructor, createExam);
router.get("/getExamByTarget", auth, getExamByTarget);
router.post("/submitExam", auth, isStudent, submitExam);
router.get("/getSubmissionsByExam", auth, isInstructor, getSubmissionsByExam);
router.post("/gradeSubmission", auth, isInstructor, gradeSubmission);
router.get("/getStudentExams", auth, isStudent, getStudentExams);
router.get("/getInstructorExams", auth, isInstructor, getInstructorExams);
router.get("/getAllExamsAdmin", auth, isAdmin, getAllExamsAdmin);
router.get("/getLeaderboard", auth, getExamLeaderboard);

module.exports = router;
