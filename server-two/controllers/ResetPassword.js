const { db } = require("../config/database");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// 1. resetPasswordToken (Pure Raw Query)
exports.resetPasswordToken = async (req, res) => {
  try {
    const email = req.body?.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // A. Check if user exists
    const userResult = await db.$query`
      SELECT id, email FROM "User"
      WHERE email = ${email}
      LIMIT 1
    `;

    const user = userResult[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User is not registerd,Please signup first",
      });
    }

    // B. Generate Token and Expiration Date (1 Hour)
    const token = crypto.randomUUID();
    const resetPasswordExpires = new Date(Date.now() + 3600000);

    // C. Update User with Token & Expiration
    await db.$execute`
      UPDATE "User"
      SET 
        token = ${token},
        "resetPasswordExpires" = ${resetPasswordExpires},
        "updatedAt" = NOW()
      WHERE email = ${email}
    `;

    // D. Send Mail
    const url = `https://study-notion-hosting-rouge.vercel.app/update-password/${token}`;
    await mailSender(
      email,
      "Password Reset Link",
      `Password Reset Link ${url}`
    );

    return res.status(200).json({
      success: true,
      message: "Email send successfully, Please check email and changed Password",
    });
  } catch (err) {
    console.error("RESET PASSWORD TOKEN ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while sending reset password email, Please try again",
    });
  }
};

// 2. resetPassword (Pure Raw Query)
exports.resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword, token } = req.body;

    if (!password || !confirmPassword || !token) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "The Password & confirm password dose not match",
      });
    }

    // A. Find user by token
    const userResult = await db.$query`
      SELECT id, "resetPasswordExpires" FROM "User"
      WHERE token = ${token}
      LIMIT 1
    `;

    const userDetails = userResult[0];

    if (!userDetails) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid",
      });
    }

    // B. Check Token Expiration
    if (
      userDetails.resetPasswordExpires &&
      new Date(userDetails.resetPasswordExpires).getTime() < Date.now()
    ) {
      return res.status(403).json({
        success: false,
        message: `Token is Expired, Please Regenerate Your Token`,
      });
    }

    // C. Hash Password & Update User
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.$execute`
      UPDATE "User"
      SET 
        password = ${hashedPassword},
        token = NULL,
        "resetPasswordExpires" = NULL,
        "updatedAt" = NOW()
      WHERE id = ${userDetails.id}
    `;

    return res.status(200).json({
      success: true,
      message: "Password reset successfull",
    });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};