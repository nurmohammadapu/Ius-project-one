// Update this with your machine's local IP when testing on physical devices or emulator
export const BASE_URL = "http://192.168.0.106:5001/api/v1";
// export const BASE_URL = "http://192.168.1.167:5001/api/v1";
// AUTH ENDPOINTS
export const endpoints = {
  SENDOTP_API: BASE_URL + "/auth/sendotp",
  SIGNUP_API: BASE_URL + "/auth/signup",
  LOGIN_API: BASE_URL + "/auth/login",
  RESETPASSTOKEN_API: BASE_URL + "/auth/reset-password-token",
  RESETPASSWORD_API: BASE_URL + "/auth/reset-password",
};

// PROFILE ENDPOINTS
export const profileEndpoints = {
  GET_USER_DETAILS_API: BASE_URL + "/profile/getUserDetails",
  GET_USER_ENROLLED_COURSES_API: BASE_URL + "/profile/getEnrolledCourses",
  GET_INSTRUCTOR_DATA_API: BASE_URL + "/profile/instructorDashboard",
};

// STUDENTS ENDPOINTS (Payment / Stripe)
export const sslStudentEndpoints = {
  COURSE_PAYMENT_API: BASE_URL + "/payment/capturePayment",
  COURSE_VERIFY_API: BASE_URL + "/payment/verifyPayment",
  CREATE_STRIPE_SESSION_API: BASE_URL + "/payment/createStripeCheckoutSession",
  VERIFY_STRIPE_PAYMENT_API: BASE_URL + "/payment/verifyStripePayment",
  DIRECT_MOBILE_PAYMENT_API: BASE_URL + "/payment/directMobilePayment",
  SEND_PAYMENT_SUCCESS_EMAIL_API: BASE_URL + "/payment/sendPaymentSuccessEmail",
};

// COURSE ENDPOINTS
export const courseEndpoints = {
  GET_ALL_COURSE_API: BASE_URL + "/course/getAllCourses",
  COURSE_DETAILS_API: BASE_URL + "/course/getCourseDetails",
  EDIT_COURSE_API: BASE_URL + "/course/editCourse",
  COURSE_CATEGORIES_API: BASE_URL + "/course/showAllCategories",
  CREATE_COURSE_API: BASE_URL + "/course/createCourse",
  CREATE_SECTION_API: BASE_URL + "/course/addSection",
  CREATE_SUBSECTION_API: BASE_URL + "/course/addSubSection",
  UPDATE_SECTION_API: BASE_URL + "/course/updateSection",
  UPDATE_SUBSECTION_API: BASE_URL + "/course/updateSubSection",
  GET_ALL_INSTRUCTOR_COURSES_API: BASE_URL + "/course/getInstructorCourses",
  DELETE_SECTION_API: BASE_URL + "/course/deleteSection",
  DELETE_SUBSECTION_API: BASE_URL + "/course/deleteSubSection",
  DELETE_COURSE_API: BASE_URL + "/course/deleteCourse",
  GET_FULL_COURSE_DETAILS_AUTHENTICATED: BASE_URL + "/course/getFullCourseDetails",
  LECTURE_COMPLETION_API: BASE_URL + "/course/updateCourseProgress",
  CREATE_RATING_API: BASE_URL + "/course/createRating",
};

// RATINGS AND REVIEWS
export const ratingsEndpoints = {
  REVIEWS_DETAILS_API: BASE_URL + "/course/getReviews",
};

// CATEGORIES API
export const categories = {
  CATEGORIES_API: BASE_URL + "/course/showAllCategories",
};

// CATALOG PAGE DATA
export const catalogData = {
  CATALOGPAGEDATA_API: BASE_URL + "/course/getCategoryPageDetails",
};

// CONTACT-US API
export const contactusEndpoint = {
  CONTACT_US_API: BASE_URL + "/reach/contact",
};

// SETTINGS PAGE API
export const settingsEndpoints = {
  UPDATE_DISPLAY_PICTURE_API: BASE_URL + "/profile/updateDisplayPicture",
  UPDATE_PROFILE_API: BASE_URL + "/profile/updateProfile",
  CHANGE_PASSWORD_API: BASE_URL + "/auth/changepassword",
  DELETE_PROFILE_API: BASE_URL + "/profile/deleteProfile",
};

// ADMIN ENDPOINTS
export const adminEndpoints = {
  GET_ALL_STUDENTS_API: BASE_URL + "/auth/admin/students",
  GET_ALL_INSTRUCTORS_API: BASE_URL + "/auth/admin/instructors",
  TOGGLE_USER_STATUS_API: BASE_URL + "/auth/admin/toggle-user-status",
  DELETE_USER_API: BASE_URL + "/auth/admin/delete-user",
  CREATE_USER_API: BASE_URL + "/auth/admin/create-user",
  GET_ALL_COURSES_API: BASE_URL + "/auth/admin/courses",
  TOGGLE_COURSE_PUBLISH_API: BASE_URL + "/auth/admin/toggle-course-publish",
  GET_PENDING_INSTRUCTORS_API: BASE_URL + "/auth/pending-instructors",
  MANAGE_INSTRUCTOR_API: BASE_URL + "/auth/manageInstructor",
  GET_FINANCIAL_REPORT_API: BASE_URL + "/auth/admin/financial-report",
};
