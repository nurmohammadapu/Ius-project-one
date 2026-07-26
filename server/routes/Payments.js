// Import the required modules
const express = require("express")
const router = express.Router()

const { capturePayment, verifyPayment, createStripeCheckoutSession, verifyStripePayment } = require("../controllers/Payments")
const { auth, isStudent} = require("../middlewares/auth")
router.post("/capturePayment", auth,isStudent, capturePayment)
router.post("/verifyPayment",auth,isStudent, verifyPayment )
router.post("/createStripeCheckoutSession", auth, isStudent, createStripeCheckoutSession)
router.post("/verifyStripePayment", auth, isStudent, verifyStripePayment)

module.exports = router