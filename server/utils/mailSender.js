const nodemailer = require("nodemailer");
require("dotenv").config();

const mailSender = async (email, title, body) => {
    try {
        console.log(`[MAIL_SENDER] Preparing to send mail to: ${email}`);
        console.log(`[MAIL_SENDER] Config -> HOST: ${process.env.MAIL_HOST}, USER: ${process.env.MAIL_USER}`);
        
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            }
        });

        let info = await transporter.sendMail({
            from: `"StudyNotion" <${process.env.MAIL_USER}>`,            
            to: `${email}`,
            subject: `${title}`,
            html: `${body}`,
        });
        
        console.log(" [MAIL_SENDER SUCCESS] Mail Sent! Message ID:", info?.messageId || info);
        return info;
    }
    catch (error) {
        console.error("❌ [MAIL_SENDER ERROR] Failed to send mail:", error.message);
        if (error.response) {
            console.error("❌ [MAIL_SENDER ERROR RESPONSE]:", error.response);
        }
        throw error;
    }
}

module.exports = mailSender;