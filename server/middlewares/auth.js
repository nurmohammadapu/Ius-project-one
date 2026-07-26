const jwt = require("jsonwebtoken");
require("dotenv").config();
const { prisma } = require("../config/database");

// auth
exports.auth = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.body.token || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token is required",
            });
        }

        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            console.log(decode);
            req.user = decode;
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: "Invalid token",
                error: err.message,
            });
        }
        next();
    } catch (err) {
        console.log(err);
        return res.status(401).json({
            success: false,
            message: "Something went wrong while validating the token",
            error: err.message,
        });
    }
};

exports.isStudent = async (req, res, next) => {
    try {
        const userDetails = await prisma.user.findUnique({ where: { email: req.user.email } });

        if (!userDetails || userDetails.accountType !== "Student") {
            return res.status(401).json({
                success: false,
                message: "This is a Protected Route for Students",
            });
        }
        next();
    } catch (error) {
        return res
            .status(500)
            .json({ success: false, message: `User Role Can't be Verified` });
    }
};

exports.isAdmin = async (req, res, next) => {
    try {
        const userDetails = await prisma.user.findUnique({ where: { email: req.user.email } });

        if (!userDetails || userDetails.accountType !== "Admin") {
            return res.status(401).json({
                success: false,
                message: "This is a Protected Route for Admin",
            });
        }
        next();
    } catch (error) {
        return res
            .status(500)
            .json({ success: false, message: `User Role Can't be Verified` });
    }
};

exports.isInstructor = async (req, res, next) => {
    try {
        const userDetails = await prisma.user.findUnique({ where: { email: req.user.email } });
        console.log(userDetails);

        if (!userDetails || userDetails.accountType !== "Instructor") {
            return res.status(401).json({
                success: false,
                message: "This is a Protected Route for Instructor",
            });
        }
        next();
    } catch (error) {
        return res
            .status(500)
            .json({ success: false, message: `User Role Can't be Verified` });
    }
};

exports.logout = (req, res) => {
    try {
        res.clearCookie('token');
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Failed to log out',
            error: err,
        });
    }
};
