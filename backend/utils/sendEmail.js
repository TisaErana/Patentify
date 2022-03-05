const nodemailer = require("nodemailer");
require('dotenv').config();

const sendEmail = async (email, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.email.com',
            service: 'gmail',
            port: 587,
            secure: true,
            auth: {
                user: process.env.email,
                pass: process.env.password,
            },
        });

        await transporter.sendMail({
            from: process.env.email,
            to: email,
            subject: subject,
            text: text,
        });

        console.log("email sent sucessfully");
    } catch (error) {
        console.log(error, "email not sent");
    }
};

module.exports = sendEmail;