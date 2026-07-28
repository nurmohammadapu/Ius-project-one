// Import the required modules
const express = require("express")
const router = express.Router()

// Import the required controllers and middleware functions
const {
  login,
  signup,
  sendotp,
  changePassword,
  manageInstructor,
  getPendingInstructors 
} = require("../controllers/Auth")
const {
  getAllStudents,
  getAllInstructors,
  toggleUserStatus,
  deleteUser,
  createUser,
  getAllCourses,
  toggleCoursePublish,
  getFinancialReport,
} = require("../controllers/Admin")
const {
  resetPasswordToken,
  resetPassword,
} = require("../controllers/ResetPassword")

const { auth , logout, isAdmin, isStudent  } = require("../middlewares/auth")

// Routes for Login, Signup, and Authentication

// ********************************************************************************************************
//                                      Authentication routes
// ********************************************************************************************************

router.post("/manageInstructor",auth, isAdmin, manageInstructor);

router.get("/pending-instructors",auth, isAdmin, getPendingInstructors);

router.get("/admin/students", auth, isAdmin, getAllStudents);
router.get("/admin/instructors", auth, isAdmin, getAllInstructors);
router.put("/admin/toggle-user-status", auth, isAdmin, toggleUserStatus);
router.delete("/admin/delete-user", auth, isAdmin, deleteUser);
router.post("/admin/create-user", auth, isAdmin, createUser);
router.get("/admin/courses", auth, isAdmin, getAllCourses);
router.put("/admin/toggle-course-publish", auth, isAdmin, toggleCoursePublish);
router.get("/admin/financial-report", auth, isAdmin, getFinancialReport);

// Route for user login
router.post("/login", login)

// Route for user signup
router.post("/signup", signup)

// Route for sending OTP to the user's email
router.post("/sendotp", sendotp)

// Route for Changing the password
router.post("/changepassword", auth, changePassword)

//logout
router.post('/logout', logout);

// ********************************************************************************************************
//                                      Reset Password
// ********************************************************************************************************

// Route for generating a reset password token
router.post("/reset-password-token", resetPasswordToken)

// Route for resetting user's password after verification
router.post("/reset-password", resetPassword)

// Export the router for use in the main application
module.exports = router