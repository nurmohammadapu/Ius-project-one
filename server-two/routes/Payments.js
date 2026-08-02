const createHttpApp = require("../httpHelper");
const router = createHttpApp.Router();

const { capturePayment, verifyPayment, createStripeCheckoutSession, verifyStripePayment, mobileSuccessPage, directMobilePayment } = require("../controllers/Payments")
const { auth, isStudent} = require("../middlewares/auth")
router.post("/capturePayment", auth,isStudent, capturePayment)
router.post("/verifyPayment",auth,isStudent, verifyPayment )
router.post("/createStripeCheckoutSession", auth, isStudent, createStripeCheckoutSession)
router.post("/verifyStripePayment", auth, isStudent, verifyStripePayment)
router.post("/directMobilePayment", auth, isStudent, directMobilePayment)
router.get("/mobile-success", mobileSuccessPage)

module.exports = router