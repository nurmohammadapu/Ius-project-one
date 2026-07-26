const { prisma } = require("../config/database");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// resetPasswordToken
exports.resetPasswordToken = async (req, res) => {
  try {
    const email = req.body.email;

    const user = await prisma.user.findUnique({ where: { email: email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User is not registerd,Please signup first",
      });
    }

    const token = crypto.randomUUID();
    const resetPasswordExpires = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { email: email },
      data: {
        token: token,
        resetPasswordExpires: resetPasswordExpires,
      },
    });

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
    return res.status(500).json({
      success: false,
      message: "Something went wrong while sending reset password email, Please try again",
    });
  }
};

// resetpassword
exports.resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword, token } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "The Password & confirm password dose not match",
      });
    }

    const userDetails = await prisma.user.findFirst({ where: { token: token } });

    if (!userDetails) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid",
      });
    }

    if (userDetails.resetPasswordExpires && new Date(userDetails.resetPasswordExpires).getTime() < Date.now()) {
      return res.status(403).json({
        success: false,
        message: `Token is Expired, Please Regenerate Your Token`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: userDetails.id },
      data: {
        password: hashedPassword,
        token: null,
        resetPasswordExpires: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successfull",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
