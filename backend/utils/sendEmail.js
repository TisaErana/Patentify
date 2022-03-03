const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.email.com',
            service: 'gmail',
            port: 587,
            secure: true,
            auth: {
                user: 'patentify.adm@gmail.com',
                pass: 'Uspto2020$$',
            },
        });

        await transporter.sendMail({
            from: 'patentify.adm@gmail.com',
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