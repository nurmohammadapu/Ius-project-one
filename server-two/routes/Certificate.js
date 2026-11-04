const createHttpApp = require("../httpHelper");
const router = createHttpApp.Router();

const {
  getCourseCertificate,
  getMyCertificates,
  verifyCertificate,
  getInstructorCertificates,
  getAdminAllCertificates,
} = require("../controllers/Certificate");

const { auth, isStudent, isInstructor, isAdmin } = require("../middlewares/auth");

// Authenticated student routes
router.get("/getCertificate/:courseId", auth, isStudent, getCourseCertificate);
router.get("/myCertificates", auth, isStudent, getMyCertificates);

// Authenticated instructor routes
router.get("/instructorCertificates", auth, isInstructor, getInstructorCertificates);

// Authenticated admin routes
router.get("/adminAllCertificates", auth, isAdmin, getAdminAllCertificates);

// Public verification route (no auth needed so QR code works for anyone)
router.get("/verify/:certificateId", verifyCertificate);

module.exports = router;

