const { db } = require("../config/database");
const crypto = require("crypto");

// Helper to check 100% course progress
const checkCourseProgress = async (courseId, userId) => {
  const lecturesResult = await db.$query`
    SELECT COUNT(subsec.id)::int AS "totalLectures"
    FROM "Section" sec
    JOIN "SubSection" subsec ON subsec."sectionId" = sec.id
    WHERE sec."courseId" = ${courseId}
  `;
  const totalLectures = Number(lecturesResult[0]?.totalLectures) || 0;
  if (totalLectures === 0) return { isComplete: false, totalLectures: 0, completedCount: 0, percentage: 0 };

  const progressResult = await db.$query`
    SELECT COUNT(cv."subSectionId")::int AS "completedCount"
    FROM "CourseProgress" cp
    JOIN "CompletedSubSection" cv ON cv."courseProgressId" = cp.id
    WHERE cp."courseID" = ${courseId} AND cp."userId" = ${userId}
  `;
  const completedCount = Number(progressResult[0]?.completedCount) || 0;

  return {
    isComplete: completedCount >= totalLectures,
    totalLectures,
    completedCount,
    percentage: Math.round((completedCount / totalLectures) * 100),
  };
};

// 1. Get or generate course certificate for logged-in student
exports.getCourseCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    if (!courseId) {
      return res.status(400).json({ success: false, message: "Course ID is required" });
    }

    // Check if certificate already exists
    let certResult = await db.$query`
      SELECT c.*, 
             u."firstName", u."lastName", u.email,
             co."courseName", co."courseDescription", co.thumbnail,
             inst."firstName" AS "instructorFirstName", inst."lastName" AS "instructorLastName"
      FROM "Certificate" c
      JOIN "User" u ON u.id = c."userId"
      JOIN "Course" co ON co.id = c."courseId"
      LEFT JOIN "User" inst ON inst.id = co."instructorId"
      WHERE c."courseId" = ${courseId} AND c."userId" = ${userId}
      LIMIT 1
    `;

    if (certResult && certResult.length > 0) {
      return res.status(200).json({
        success: true,
        data: certResult[0],
      });
    }

    // Verify course completion
    const progress = await checkCourseProgress(courseId, userId);
    if (!progress.isComplete) {
      return res.status(403).json({
        success: false,
        message: `Course not completed yet (${progress.percentage}%). Complete all lectures to claim your certificate.`,
        progress,
      });
    }

    // Generate unique Certificate ID e.g. "SN-2026-X89B2"
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const certificateId = `SN-${new Date().getFullYear()}-${randomSuffix}`;
    const id = crypto.randomUUID();

    await db.$execute`
      INSERT INTO "Certificate" (id, "certificateId", "userId", "courseId", "issueDate")
      VALUES (${id}, ${certificateId}, ${userId}, ${courseId}, NOW())
    `;

    // Fetch full details
    certResult = await db.$query`
      SELECT c.*, 
             u."firstName", u."lastName", u.email,
             co."courseName", co."courseDescription", co.thumbnail,
             inst."firstName" AS "instructorFirstName", inst."lastName" AS "instructorLastName"
      FROM "Certificate" c
      JOIN "User" u ON u.id = c."userId"
      JOIN "Course" co ON co.id = c."courseId"
      LEFT JOIN "User" inst ON inst.id = co."instructorId"
      WHERE c.id = ${id}
      LIMIT 1
    `;

    return res.status(201).json({
      success: true,
      message: "Congratulations! Your certificate has been generated.",
      data: certResult[0],
    });
  } catch (error) {
    console.error("GET CERTIFICATE ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch certificate" });
  }
};

// 2. Get all certificates of the logged-in student
exports.getMyCertificates = async (req, res) => {
  try {
    const userId = req.user.id;
    const certs = await db.$query`
      SELECT c.*, 
             co."courseName", co.thumbnail,
             inst."firstName" AS "instructorFirstName", inst."lastName" AS "instructorLastName"
      FROM "Certificate" c
      JOIN "Course" co ON co.id = c."courseId"
      LEFT JOIN "User" inst ON inst.id = co."instructorId"
      WHERE c."userId" = ${userId}
      ORDER BY c."issueDate" DESC
    `;

    return res.status(200).json({
      success: true,
      data: certs,
    });
  } catch (error) {
    console.error("GET MY CERTIFICATES ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch certificates" });
  }
};

// 3. Public Verification Endpoint (for QR code scan)
exports.verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    if (!certificateId) {
      return res.status(400).json({ success: false, message: "Certificate ID is required" });
    }

    const certResult = await db.$query`
      SELECT c."certificateId", c."issueDate",
             u."firstName", u."lastName",
             co."courseName",
             inst."firstName" AS "instructorFirstName", inst."lastName" AS "instructorLastName"
      FROM "Certificate" c
      JOIN "User" u ON u.id = c."userId"
      JOIN "Course" co ON co.id = c."courseId"
      LEFT JOIN "User" inst ON inst.id = co."instructorId"
      WHERE UPPER(c."certificateId") = UPPER(${certificateId.trim()})
      LIMIT 1
    `;

    if (!certResult || certResult.length === 0) {
      return res.status(404).json({
        success: false,
        isValid: false,
        message: "Invalid Certificate ID. No matching certificate found.",
      });
    }

    return res.status(200).json({
      success: true,
      isValid: true,
      data: certResult[0],
      message: "Certificate is authentic and officially issued by StudyNotion.",
    });
  } catch (error) {
    console.error("VERIFY CERTIFICATE ERROR:", error);
    return res.status(500).json({ success: false, message: "Error verifying certificate" });
  }
};

// 4. Get instructor certificates overview (courses, enrolled students, certified students)
exports.getInstructorCertificates = async (req, res) => {
  try {
    const instructorId = req.user.id;

    const courses = await db.$query`
      SELECT 
        c.id, 
        c."courseName", 
        c.thumbnail,
        COUNT(DISTINCT ce."userId")::int AS "enrolledCount",
        COUNT(DISTINCT cert."userId")::int AS "certifiedCount"
      FROM "Course" c
      LEFT JOIN "CourseEnrollment" ce ON ce."courseId" = c.id
      LEFT JOIN "Certificate" cert ON cert."courseId" = c.id
      WHERE c."instructorId" = ${instructorId}
      GROUP BY c.id, c."courseName", c.thumbnail
      ORDER BY c."createdAt" DESC
    `;

    const certificates = await db.$query`
      SELECT 
        cert.id,
        cert."certificateId",
        cert."issueDate",
        c.id AS "courseId",
        c."courseName",
        u.id AS "studentId",
        u."firstName",
        u."lastName",
        u.email,
        u.image
      FROM "Certificate" cert
      JOIN "Course" c ON c.id = cert."courseId"
      JOIN "User" u ON u.id = cert."userId"
      WHERE c."instructorId" = ${instructorId}
      ORDER BY cert."issueDate" DESC
    `;

    const totalStudentsEnrolled = courses.reduce((sum, item) => sum + (Number(item.enrolledCount) || 0), 0);
    const totalCertificatesIssued = certificates.length;

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalCourses: courses.length,
          totalStudentsEnrolled,
          totalCertificatesIssued,
        },
        courses,
        certificates,
      },
    });
  } catch (error) {
    console.error("GET INSTRUCTOR CERTIFICATES ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch instructor certificates" });
  }
};

// 5. Get all platform certificates (Admin only)
exports.getAdminAllCertificates = async (req, res) => {
  try {
    const certificates = await db.$query`
      SELECT 
        cert.id,
        cert."certificateId",
        cert."issueDate",
        c.id AS "courseId",
        c."courseName",
        u.id AS "studentId",
        u."firstName",
        u."lastName",
        u.email,
        u.image,
        inst."firstName" AS "instructorFirstName",
        inst."lastName" AS "instructorLastName"
      FROM "Certificate" cert
      JOIN "Course" c ON c.id = cert."courseId"
      JOIN "User" u ON u.id = cert."userId"
      LEFT JOIN "User" inst ON inst.id = c."instructorId"
      ORDER BY cert."issueDate" DESC
    `;

    const totalDistinctStudents = new Set(certificates.map((c) => c.studentId)).size;
    const totalDistinctCourses = new Set(certificates.map((c) => c.courseId)).size;

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalCertificates: certificates.length,
          totalDistinctStudents,
          totalDistinctCourses,
        },
        certificates,
      },
    });
  } catch (error) {
    console.error("GET ADMIN CERTIFICATES ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch admin certificates" });
  }
};


