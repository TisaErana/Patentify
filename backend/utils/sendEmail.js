const nodemailer = require("nodemailer");
const bcrypt = require('bcryptjs');
const {v4: uuid} = require("uuid");
require('dotenv').config();

const transporter = nodemailer.createTransport({  
    service:'zoho',
    host: "smtp.zoho.com",
    port: 465,
    secure: true,
    auth:{  
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_PASS,
}})
  
  transporter.verify((error, success)=> {  
    if(error){  
      console.log(error);
    } else {
      console.log(success);
      console.log("Ready to send emails.");
    }
})  

const userconfirmed = require("../models/user_confirmed_model");

const sendVerificationEmail = ({_id, email}, res) => {     
    //If testing locally then it would be localhost, if on patentify website then it would be the URL for the actual patentify website.
    const currentUrl = process.env.DOMAIN_NAME; 
    const uniqueString = uuid() + _id;
    const mailOptions = {  
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Verify Your Email",
        html: `<p>Verify your email address to finish your account and be able to login.</p>
        <p>Click <a href=${currentUrl + "/verify/" + _id + "/" + uniqueString}>here</a> to finalize the process.</p>`,
    };
    const saltRounds = 10;
    bcrypt.hash(uniqueString, saltRounds).then((hashedUniqueString) => {  
        const newConfirmed = new userconfirmed({  
            userId: _id,
            uniqueString: hashedUniqueString,
        });
        newConfirmed.save().then(() => {  
            transporter.sendMail(mailOptions).then(() =>{  
                
            }).catch((error) => {  
                console.log(error);
              
            })
        }).catch((error) => {  
            console.log(error);
            res.json({  
                status: "FAILED",
                message: "Could not verify!",
            });
        })
    }).catch((error) => {  
        console.log(error);
        res.json({  
            status: "FAILED",
            message: "Could not verify!",
        });
    })
}

const sendEmail = async (email, subject, text) => {
    try {
      await transporter.sendMail({
            from: process.env.AUTH_EMAIL,
            to: email,
            subject: subject,
            text: text,
        });

        //console.log("Password recovery email sent sucessfully.");
    } catch (error) {
        console.log(error, "Password recovery email could not be sent.");
    }
};

module.exports = { sendVerificationEmail, sendEmail };
