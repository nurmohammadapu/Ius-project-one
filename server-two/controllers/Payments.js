const { instance } = require("../config/razorpay");
const { db } = require("../config/database");
const mailSender = require("../utils/mailSender");
const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail");
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail");
const { stripeInstance } = require("../config/stripe");
const crypto = require("crypto");

// Fixed enrollStudents helper function
const enrollStudents = async (courses, userId) => {
  if (!courses || !userId) {
    throw new Error("Please Provide Course ID and User ID");
  }

  for (const courseId of courses) {
    // Check if course exists
    const courseResult = await db.$query`
      SELECT id, "courseName" FROM "Course" WHERE id = ${courseId}
    `;

    const course = courseResult[0];

    if (!course) {
      throw new Error(`Course not found: ${courseId}`);
    }

    // Check if already enrolled in "_EnrolledStudents"
    const enrollmentCheck = await db.$query`
      SELECT * FROM "_EnrolledStudents"
      WHERE "A" = ${courseId} AND "B" = ${userId}
    `;

    if (!enrollmentCheck || enrollmentCheck.length === 0) {
      // Connect Student in "_EnrolledStudents"
      await db.$execute`
        INSERT INTO "_EnrolledStudents" ("A", "B")
        VALUES (${courseId}, ${userId})
      `;
    }

    // Check or Create CourseProgress (FIXED: Removed createdAt, updatedAt)
    const progressResult = await db.$query`
      SELECT id FROM "CourseProgress"
      WHERE "courseID" = ${courseId} AND "userId" = ${userId}
      LIMIT 1
    `;

    if (!progressResult || progressResult.length === 0) {
      await db.$execute`
        INSERT INTO "CourseProgress" (id, "courseID", "userId")
        VALUES (
          gen_random_uuid()::text,
          ${courseId},
          ${userId}
        )
      `;
    }

    // Get Enrolled Student Info for Email Notification
    const studentResult = await db.$query`
      SELECT email, "firstName", "lastName" FROM "User" WHERE id = ${userId}
    `;

    const enrolledStudent = studentResult[0];

    if (enrolledStudent) {
      mailSender(
        enrolledStudent.email,
        `Successfully Enrolled into ${course.courseName}`,
        courseEnrollmentEmail(
          course.courseName,
          `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
        )
      ).then((res) => {
        console.log("Email sent successfully: ", res?.response);
      }).catch((err) => {
        console.error("Background enrollment email error:", err);
      });
    }
  }
};

// 1. Capture the payment and initiate the Razorpay order (Pure Raw Query)
exports.capturePayment = async (req, res) => {
  const { courses } = req.body;
  const userId = req.user?.id;

  if (!courses || courses.length === 0) {
    return res.json({ success: false, message: "Please Provide Course ID" });
  }

  let total_amount = 0;

  for (const course_id of courses) {
    try {
      const courseResult = await db.$query`
        SELECT c.id, c.price,
          EXISTS(
            SELECT 1 FROM "_EnrolledStudents" es
            WHERE es."A" = c.id AND es."B" = ${userId}
          ) AS "isEnrolled"
        FROM "Course" c
        WHERE c.id = ${course_id}
      `;

      const course = courseResult[0];

      if (!course) {
        return res
          .status(200)
          .json({ success: false, message: "Could not find the Course" });
      }

      if (course.isEnrolled) {
        return res
          .status(200)
          .json({ success: false, message: "Student is already Enrolled" });
      }

      total_amount += Number(course.price) || 0;
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  const options = {
    amount: total_amount * 100,
    currency: "INR",
    receipt: Math.random(Date.now()).toString(),
  };

  try {
    const paymentResponse = await instance.orders.create(options);
    console.log(paymentResponse);
    res.json({
      success: true,
      data: paymentResponse,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Could not initiate order." });
  }
};

// 2. Verify Razorpay Payment
exports.verifyPayment = async (req, res) => {
  const razorpay_order_id = req.body?.razorpay_order_id;
  const razorpay_payment_id = req.body?.razorpay_payment_id;
  const razorpay_signature = req.body?.razorpay_signature;
  const courses = req.body?.courses;

  const userId = req.user?.id;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !courses ||
    !userId
  ) {
    return res.status(200).json({ success: false, message: "Payment Failed" });
  }

  let body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    await enrollStudents(courses, userId, res);
    return res.status(200).json({ success: true, message: "Payment Verified" });
  }

  return res.status(200).json({ success: false, message: "Payment Failed" });
};

// 3. Send Payment Success Email (Pure Raw Query)
exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, paymentId, amount } = req.body;
  const userId = req.user?.id;

  if (!orderId || !paymentId || !amount || !userId) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide all the details" });
  }

  try {
    const studentResult = await db.$query`
      SELECT email, "firstName", "lastName" FROM "User" WHERE id = ${userId}
    `;

    const enrolledStudent = studentResult[0];

    if (enrolledStudent) {
      await mailSender(
        enrolledStudent.email,
        `Payment Received`,
        paymentSuccessEmail(
          `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
          amount / 100,
          orderId,
          paymentId
        )
      );
    }
  } catch (error) {
    console.error("error in sending mail", error);
    return res
      .status(400)
      .json({ success: false, message: "Could not send email" });
  }
};

// 4. Capture the payment and initiate the Stripe checkout session (Pure Raw Query)
exports.createStripeCheckoutSession = async (req, res) => {
  const { courses } = req.body;
  const userId = req.user?.id;

  if (!courses || courses.length === 0) {
    return res.json({ success: false, message: "Please Provide Course ID" });
  }

  let total_amount = 0;
  const lineItems = [];

  for (const course_id of courses) {
    try {
      const courseResult = await db.$query`
        SELECT c.id, c."courseName", c."courseDescription", c.thumbnail, c.price,
          EXISTS(
            SELECT 1 FROM "_EnrolledStudents" es
            WHERE es."A" = c.id AND es."B" = ${userId}
          ) AS "isEnrolled"
        FROM "Course" c
        WHERE c.id = ${course_id}
      `;

      const course = courseResult[0];

      if (!course) {
        return res
          .status(404)
          .json({ success: false, message: "Could not find the Course" });
      }

      if (course.isEnrolled) {
        return res
          .status(400)
          .json({ success: false, message: "Student is already Enrolled" });
      }

      const coursePrice = Number(course.price) || 0;
      total_amount += coursePrice;

      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: course.courseName,
            description: course.courseDescription || "",
            images: course.thumbnail ? [course.thumbnail] : [],
          },
          unit_amount: Math.round(coursePrice * 100),
        },
        quantity: 1,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  const customSuccessUrl = req.body?.success_url;
  const customCancelUrl = req.body?.cancel_url;

  try {
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: customSuccessUrl || `http://localhost:5173/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: customCancelUrl || `http://localhost:5173/dashboard/cart`,
      metadata: {
        userId: userId,
        courses: JSON.stringify(courses),
      },
    });

    res.json({
      success: true,
      data: {
        sessionUrl: session.url,
        sessionId: session.id,
      },
    });
  } catch (error) {
    console.error("STRIPE SESSION CREATE ERROR:", error);
    res.status(500).json({ success: false, message: "Could not initiate Stripe session." });
  }
};

// 5. Mobile Success Page Response
exports.mobileSuccessPage = async (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Successful</title>
        <style>
          body { background-color: #000814; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 40px 20px; margin: 0; }
          .card { background-color: #161D29; border: 1px solid #2C333F; border-radius: 16px; padding: 30px 20px; max-width: 400px; margin: 40px auto; }
          .icon { font-size: 50px; margin-bottom: 10px; }
          h2 { color: #06D6A0; margin-bottom: 10px; }
          p { color: #AFB2BF; font-size: 14px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🎉</div>
          <h2>Payment Completed!</h2>
          <p>Thank you for your purchase. Returning you to the mobile app...</p>
        </div>
      </body>
    </html>
  `);
};

// 6. Verify Stripe Payment (Pure Raw Query)
exports.verifyStripePayment = async (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user?.id;

  if (!sessionId) {
    return res.status(400).json({ success: false, message: "Session ID is required" });
  }

  try {
    const session = await stripeInstance.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const metadata = session.metadata;
      if (metadata.userId !== userId) {
        return res.status(403).json({ success: false, message: "Unauthorized user for this payment session" });
      }

      const courses = JSON.parse(metadata.courses);
      const enrolledCourses = [];

      for (const courseId of courses) {
        const courseResult = await db.$query`
          SELECT c.id,
            EXISTS(
              SELECT 1 FROM "_EnrolledStudents" es
              WHERE es."A" = c.id AND es."B" = ${userId}
            ) AS "isEnrolled"
          FROM "Course" c
          WHERE c.id = ${courseId}
        `;

        const course = courseResult[0];

        if (course && !course.isEnrolled) {
          enrolledCourses.push(courseId);
        }
      }

      if (enrolledCourses.length > 0) {
        await enrollStudents(enrolledCourses, userId, res);
      }
      return res.status(200).json({ success: true, message: "Payment Verified" });
    } else {
      return res.status(400).json({ success: false, message: "Payment not completed" });
    }
  } catch (error) {
    console.error("STRIPE VERIFY ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Direct Mobile Payment Gateway Process (Pure Raw Query)
exports.directMobilePayment = async (req, res) => {
  try {
    const { courses } = req.body;
    const userId = req.user?.id;

    if (!courses || courses.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide course IDs." });
    }

    const enrolledCourses = [];

    for (const courseId of courses) {
      const courseResult = await db.$query`
        SELECT c.id,
          EXISTS(
            SELECT 1 FROM "_EnrolledStudents" es
            WHERE es."A" = c.id AND es."B" = ${userId}
          ) AS "isEnrolled"
        FROM "Course" c
        WHERE c.id = ${courseId}
      `;

      const course = courseResult[0];

      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }

      if (course.isEnrolled) {
        return res.status(400).json({ success: false, message: "You are already enrolled in this course." });
      }

      enrolledCourses.push(courseId);
    }

    if (enrolledCourses.length > 0) {
      await enrollStudents(enrolledCourses, userId);
      return res.status(200).json({
        success: true,
        message: "Payment processed successfully! Course unlocked.",
      });
    }

    return res.status(400).json({ success: false, message: "Payment failed." });
  } catch (error) {
    console.error("DIRECT MOBILE PAYMENT ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};