// const bcrypt = require("bcrypt");
// const { prisma } = require("../config/database");
// const jwt = require("jsonwebtoken");
// const otpGenerator = require("otp-generator");

// const mailSender = require("../utils/mailSender");
// const { passwordUpdated } = require("../mail/templates/passwordUpdate");
// const { instructorApprovalConfirmation, instructorDenial, userCreationConfirmation, instructorApproval } = require("../mail/templates/instructorApprovalConfirmation");

// require("dotenv").config();

// // Signup Controller for Registering Users
// exports.signup = async (req, res) => {
//   try {
//     const {
//       firstName,
//       lastName,
//       email,
//       password,
//       confirmPassword,
//       accountType,
//       contactNumber,
//       otp,
//     } = req.body;

//     if (
//       !firstName ||
//       !lastName ||
//       !email ||
//       !password ||
//       !confirmPassword ||
//       !otp
//     ) {
//       return res.status(403).send({
//         success: false,
//         message: "All Fields are required",
//       });
//     }

//     if (password !== confirmPassword) {
//       return res.status(400).json({
//         success: false,
//         message: "Password and Confirm Password do not match. Please try again.",
//       });
//     }

//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: "User already exists. Please sign in to continue.",
//       });
//     }

//     const response = await prisma.oTP.findMany({
//       where: { email },
//       orderBy: { createdAt: "desc" },
//       take: 1,
//     });
//     if (response.length === 0 || otp !== response[0].otp) {
//       return res.status(400).json({
//         success: false,
//         message: "The OTP is not valid",
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     let approved = true;
//     if (accountType === "Instructor") {
//       approved = false;

//       // Fetch admin email from database
//       const admin = await prisma.user.findFirst({
//         where: { accountType: "Admin" },
//         select: { email: true },
//       });
//       const adminEmail = admin?.email;

//       if (adminEmail) {
//         await mailSender(
//           adminEmail,
//           "New Instructor Approval Request",
//           instructorApproval(firstName, lastName, email)
//         );
//       }
//     }

//     const profileDetails = await prisma.profile.create({
//       data: {
//         gender: null,
//         dateOfBirth: null,
//         about: null,
//         contactNumber: contactNumber || null,
//       },
//     });

//     const user = await prisma.user.create({
//       data: {
//         firstName,
//         lastName,
//         email,
//         password: hashedPassword,
//         accountType: accountType,
//         approved: approved,
//         profileId: profileDetails.id,
//         image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
//       },
//       include: {
//         additionalDetails: true,
//       },
//     });

//     await mailSender(
//       email,
//       "Account Created Successfully",
//       userCreationConfirmation(firstName, lastName, accountType)
//     );

//     return res.status(200).json({
//       success: true,
//       user,
//       message: "User registered successfully",
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "User cannot be registered. Please try again.",
//     });
//   }
// };

// // Login controller for authenticating users
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Please Fill up All the Required Fields",
//       });
//     }

//     const user = await prisma.user.findUnique({
//       where: { email },
//       include: { additionalDetails: true },
//     });

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "User is not Registered with Us. Please SignUp to Continue.",
//       });
//     }

//     if (!user.active) {
//       return res.status(403).json({
//         success: false,
//         message: "Your account is deactivated. Please contact the administrator.",
//       });
//     }

//     if (user.accountType === "Instructor" && !user.approved) {
//       return res.status(403).json({
//         success: false,
//         message: "Wait for admin approval to join as Instructor",
//       });
//     }

//     if (await bcrypt.compare(password, user.password)) {
//       const token = jwt.sign(
//         { email: user.email, id: user.id, role: user.accountType },
//         process.env.JWT_SECRET,
//         { expiresIn: "24h" }
//       );

//       const userToReturn = { ...user, token };
//       delete userToReturn.password;

//       const options = {
//         expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
//         httpOnly: true,
//       };
//       res.cookie("token", token, options).status(200).json({
//         success: true,
//         token,
//         user: userToReturn,
//         message: "User Login Success",
//       });
//     } else {
//       return res.status(401).json({
//         success: false,
//         message: "Password is incorrect",
//       });
//     }
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Login Failure. Please Try Again.",
//     });
//   }
// };

// // Send OTP For Email Verification
// exports.sendotp = async (req, res) => {
//   try {
//     const { email } = req.body;
//     console.log("📩 [SEND_OTP] Request received for email:", email);

//     const checkUserPresent = await prisma.user.findUnique({ where: { email } });

//     if (checkUserPresent) {
//       console.log("⚠️ [SEND_OTP] User is already registered:", email);
//       return res.status(401).json({
//         success: false,
//         message: `User is Already Registered`,
//       });
//     }

//     var otp = otpGenerator.generate(6, {
//       upperCaseAlphabets: false,
//       lowerCaseAlphabets: false,
//       specialChars: false,
//     });

//     let result = await prisma.oTP.findFirst({ where: { otp } });
//     while (result) {
//       otp = otpGenerator.generate(6, {
//         upperCaseAlphabets: false,
//         lowerCaseAlphabets: false,
//         specialChars: false,
//       });
//       result = await prisma.oTP.findFirst({ where: { otp } });
//     }
//     console.log("🔑 [SEND_OTP] Generated unique OTP:", otp);

//     const otpBody = await prisma.oTP.create({
//       data: { email, otp },
//     });
//     console.log("💾 [SEND_OTP] OTP saved to Database successfully:", otpBody.id);

//     // Send Mail
//     const mailSenderUtil = require("../utils/mailSender");
//     const emailTemplate = require("../mail/templates/emailVerificationTemplate");
//     try {
//       await mailSenderUtil(email, "Verification Email from StudyNotion", emailTemplate(otp));
//       console.log("✉️ [SEND_OTP] Verification Email triggered successfully.");
//     } catch (mailErr) {
//       console.error("❌ [SEND_OTP MAIL ERROR] Failed to send Verification Mail:", mailErr.message);
//     }

//     res.status(200).json({
//       success: true,
//       message: `OTP Sent Successfully`,
//       otp,
//     });
//   } catch (error) {
//     console.error("❌ [SEND_OTP FATAL ERROR]:", error);
//     return res.status(500).json({ success: false, error: error.message });
//   }
// };

// // Controller for Changing Password
// exports.changePassword = async (req, res) => {
//   try {
//     const userDetails = await prisma.user.findUnique({
//       where: { id: req.user.id },
//     });

//     const { oldPassword, newPassword } = req.body;

//     const isPasswordMatch = await bcrypt.compare(
//       oldPassword,
//       userDetails.password
//     );
//     if (!isPasswordMatch) {
//       return res
//         .status(401)
//         .json({ success: false, message: "The password is incorrect" });
//     }

//     const encryptedPassword = await bcrypt.hash(newPassword, 10);
//     const updatedUserDetails = await prisma.user.update({
//       where: { id: req.user.id },
//       data: { password: encryptedPassword },
//     });

//     try {
//       const emailResponse = await mailSender(
//         updatedUserDetails.email,
//         "Password for your account has been updated",
//         passwordUpdated(
//           updatedUserDetails.email,
//           `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
//         )
//       );
//       console.log("Email sent successfully:", emailResponse?.response);
//     } catch (error) {
//       console.error("Error occurred while sending email:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Error occurred while sending email",
//         error: error.message,
//       });
//     }

//     return res
//       .status(200)
//       .json({ success: true, message: "Password updated successfully" });
//   } catch (error) {
//     console.error("Error occurred while updating password:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Error occurred while updating password",
//       error: error.message,
//     });
//   }
// };

// // getPendingInstructors
// exports.getPendingInstructors = async (req, res) => {
//   try {
//     const pendingInstructors = await prisma.user.findMany({
//       where: {
//         accountType: "Instructor",
//         approved: false,
//       },
//     });

//     if (pendingInstructors.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No pending instructors found.",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Pending instructors retrieved successfully.",
//       data: pendingInstructors,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Server error: Unable to retrieve pending instructors.",
//     });
//   }
// };

// // manageInstructor
// exports.manageInstructor = async (req, res) => {
//   try {
//     const { instructorId, action } = req.body;

//     const instructor = await prisma.user.findUnique({
//       where: { id: instructorId },
//     });

//     if (!instructor || instructor.accountType !== "Instructor") {
//       return res.status(404).json({
//         success: false,
//         message: "Instructor not found or user is not an instructor",
//       });
//     }

//     if (action === "approve") {
//       if (instructor.approved) {
//         return res.status(400).json({
//           success: false,
//           message: "Instructor is already approved",
//         });
//       }

//       await prisma.user.update({
//         where: { id: instructorId },
//         data: { approved: true },
//       });

//       await mailSender(
//         instructor.email,
//         "Instructor Approval Confirmation",
//         instructorApprovalConfirmation(instructor.firstName, instructor.lastName)
//       );

//       return res.status(200).json({
//         success: true,
//         message: "Instructor approved successfully",
//       });

//     } else if (action === "deny") {
//       await prisma.user.delete({
//         where: { id: instructorId },
//       });

//       await mailSender(
//         instructor.email,
//         "Instructor Approval Denied",
//         instructorDenial(instructor.firstName, instructor.lastName)
//       );

//       return res.status(200).json({
//         success: true,
//         message: "Instructor denied and removed successfully",
//       });

//     } else {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid action specified",
//       });
//     }

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to manage instructor",
//     });
//   }
// };





const bcrypt = require("bcrypt");
const { prisma } = require("../config/database");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");

const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const {
  instructorApprovalConfirmation,
  instructorDenial,
  userCreationConfirmation,
  instructorApproval,
} = require("../mail/templates/instructorApprovalConfirmation");

require("dotenv").config();

// Signup Controller for Registering Users
exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).send({
        success: false,
        message: "All Fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and Confirm Password do not match. Please try again.",
      });
    }

    // Raw SQL Check for Existing User
    const existingUsers = await prisma.$queryRaw`
      SELECT id FROM "User" WHERE email = ${email}
    `;
    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User already exists. Please sign in to continue.",
      });
    }

    // Raw SQL Check for Latest OTP
    const otps = await prisma.$queryRaw`
      SELECT otp FROM "OTP" 
      WHERE email = ${email} 
      ORDER BY "createdAt" DESC 
      LIMIT 1
    `;
    if (!otps || otps.length === 0 || otp !== otps[0].otp) {
      return res.status(400).json({
        success: false,
        message: "The OTP is not valid",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let approved = true;
    if (accountType === "Instructor") {
      approved = false;

      // Raw SQL Fetch Admin Email
      const admins = await prisma.$queryRaw`
        SELECT email FROM "User" 
        WHERE "accountType" = 'Admin'::"AccountType" 
        LIMIT 1
      `;
      const adminEmail = admins[0]?.email;

      if (adminEmail) {
        await mailSender(
          adminEmail,
          "New Instructor Approval Request",
          instructorApproval(firstName, lastName, email)
        );
      }
    }

    // Raw SQL Insert Profile
    const newProfiles = await prisma.$queryRaw`
      INSERT INTO "Profile" (id, "contactNumber")
      VALUES (gen_random_uuid()::text, ${contactNumber || null})
      RETURNING id
    `;
    const profileId = newProfiles[0]?.id;
    const imageUrl = `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`;

    // Raw SQL Insert User
    const newUsers = await prisma.$queryRaw`
      INSERT INTO "User" (
        id, "firstName", "lastName", email, password, "accountType",
        approved, active, "profileId", image, "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid()::text, ${firstName}, ${lastName}, ${email}, ${hashedPassword}, ${accountType}::"AccountType",
        ${approved}, true, ${profileId}, ${imageUrl}, NOW(), NOW()
      )
      RETURNING *
    `;

    // JOIN Profile to return additionalDetails structure expected by client
    const userResult = await prisma.$queryRaw`
      SELECT 
        u.*,
        json_build_object(
          'id', p.id,
          'gender', p.gender,
          'dateOfBirth', p."dateOfBirth",
          'about', p.about,
          'contactNumber', p."contactNumber"
        ) AS "additionalDetails"
      FROM "User" u
      LEFT JOIN "Profile" p ON u."profileId" = p.id
      WHERE u.id = ${newUsers[0].id}
    `;

    await mailSender(
      email,
      "Account Created Successfully",
      userCreationConfirmation(firstName, lastName, accountType)
    );

    return res.status(200).json({
      success: true,
      user: userResult[0],
      message: "User registered successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered. Please try again.",
    });
  }
};

// Login controller for authenticating users
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please Fill up All the Required Fields",
      });
    }

    // Raw SQL Fetch User with Profile
    const users = await prisma.$queryRaw`
      SELECT 
        u.*,
        json_build_object(
          'id', p.id,
          'gender', p.gender,
          'dateOfBirth', p."dateOfBirth",
          'about', p.about,
          'contactNumber', p."contactNumber"
        ) AS "additionalDetails"
      FROM "User" u
      LEFT JOIN "Profile" p ON u."profileId" = p.id
      WHERE u.email = ${email}
    `;

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User is not Registered with Us. Please SignUp to Continue.",
      });
    }

    const user = users[0];

    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: "Your account is deactivated. Please contact the administrator.",
      });
    }

    if (user.accountType === "Instructor" && !user.approved) {
      return res.status(403).json({
        success: false,
        message: "Wait for admin approval to join as Instructor",
      });
    }

    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        { email: user.email, id: user.id, role: user.accountType },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      const userToReturn = { ...user, token };
      delete userToReturn.password;

      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user: userToReturn,
        message: "User Login Success",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Login Failure. Please Try Again.",
    });
  }
};

// Send OTP For Email Verification
exports.sendotp = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("📩 [SEND_OTP] Request received for email:", email);

    // Raw SQL Check User
    const users = await prisma.$queryRaw`
      SELECT id FROM "User" WHERE email = ${email}
    `;

    if (users && users.length > 0) {
      console.log("⚠️ [SEND_OTP] User is already registered:", email);
      return res.status(401).json({
        success: false,
        message: `User is Already Registered`,
      });
    }

    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    let result = await prisma.$queryRaw`
      SELECT id FROM "OTP" WHERE otp = ${otp} LIMIT 1
    `;
    while (result && result.length > 0) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await prisma.$queryRaw`
        SELECT id FROM "OTP" WHERE otp = ${otp} LIMIT 1
      `;
    }
    console.log("🔑 [SEND_OTP] Generated unique OTP:", otp);

    // Raw SQL Insert OTP
    const otpResult = await prisma.$queryRaw`
      INSERT INTO "OTP" (id, email, otp, "createdAt")
      VALUES (gen_random_uuid()::text, ${email}, ${otp}, NOW())
      RETURNING id
    `;
    console.log("💾 [SEND_OTP] OTP saved to Database successfully:", otpResult[0]?.id);

    // Send Mail
    const mailSenderUtil = require("../utils/mailSender");
    const emailTemplate = require("../mail/templates/emailVerificationTemplate");
    try {
      await mailSenderUtil(email, "Verification Email from StudyNotion", emailTemplate(otp));
      console.log("✉️ [SEND_OTP] Verification Email triggered successfully.");
    } catch (mailErr) {
      console.error("❌ [SEND_OTP MAIL ERROR] Failed to send Verification Mail:", mailErr.message);
    }

    res.status(200).json({
      success: true,
      message: `OTP Sent Successfully`,
      otp,
    });
  } catch (error) {
    console.error("❌ [SEND_OTP FATAL ERROR]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Controller for Changing Password
exports.changePassword = async (req, res) => {
  try {
    const users = await prisma.$queryRaw`
      SELECT * FROM "User" WHERE id = ${req.user.id}
    `;

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const userDetails = users[0];
    const { oldPassword, newPassword } = req.body;

    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );
    if (!isPasswordMatch) {
      return res
        .status(401)
        .json({ success: false, message: "The password is incorrect" });
    }

    const encryptedPassword = await bcrypt.hash(newPassword, 10);

    // Raw SQL Update Password
    const updatedUsers = await prisma.$queryRaw`
      UPDATE "User"
      SET password = ${encryptedPassword}, "updatedAt" = NOW()
      WHERE id = ${req.user.id}
      RETURNING *
    `;
    const updatedUserDetails = updatedUsers[0];

    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        "Password for your account has been updated",
        passwordUpdated(
          updatedUserDetails.email,
          `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
        )
      );
      console.log("Email sent successfully:", emailResponse?.response);
    } catch (error) {
      console.error("Error occurred while sending email:", error);
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error occurred while updating password:", error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    });
  }
};

// getPendingInstructors
exports.getPendingInstructors = async (req, res) => {
  try {
    const pendingInstructors = await prisma.$queryRaw`
      SELECT * FROM "User"
      WHERE "accountType" = 'Instructor'::"AccountType" AND approved = false
    `;

    if (!pendingInstructors || pendingInstructors.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No pending instructors found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Pending instructors retrieved successfully.",
      data: pendingInstructors,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error: Unable to retrieve pending instructors.",
    });
  }
};

// manageInstructor
exports.manageInstructor = async (req, res) => {
  try {
    const { instructorId, action } = req.body;

    const instructors = await prisma.$queryRaw`
      SELECT * FROM "User" WHERE id = ${instructorId}
    `;

    if (
      !instructors ||
      instructors.length === 0 ||
      instructors[0].accountType !== "Instructor"
    ) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found or user is not an instructor",
      });
    }

    const instructor = instructors[0];

    if (action === "approve") {
      if (instructor.approved) {
        return res.status(400).json({
          success: false,
          message: "Instructor is already approved",
        });
      }

      await prisma.$executeRaw`
        UPDATE "User"
        SET approved = true, "updatedAt" = NOW()
        WHERE id = ${instructorId}
      `;

      await mailSender(
        instructor.email,
        "Instructor Approval Confirmation",
        instructorApprovalConfirmation(instructor.firstName, instructor.lastName)
      );

      return res.status(200).json({
        success: true,
        message: "Instructor approved successfully",
      });
    } else if (action === "deny") {
      await prisma.$executeRaw`
        DELETE FROM "User" WHERE id = ${instructorId}
      `;

      await mailSender(
        instructor.email,
        "Instructor Approval Denied",
        instructorDenial(instructor.firstName, instructor.lastName)
      );

      return res.status(200).json({
        success: true,
        message: "Instructor denied and removed successfully",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action specified",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to manage instructor",
    });
  }
};