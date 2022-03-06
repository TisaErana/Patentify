// Create Strategy
const Strategy = require("passport-local").Strategy;
const nodemailer = require("nodemailer");
// Import helpers for bycrpt
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const {v4: uuid} = require("uuid");
require("dotenv").config();


let transporter = nodemailer.createTransport({  
    service: "gmail",
    auth:{  
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_PASS,
    }
    })
  
  transporter.verify((error, success)=> {  
    if(error){  
      console.log(error);
    } else {
      console.log("Ready for messages");
      console.log(success);
    }
})
// Import models
const User = require("../../../models/User_model");

const userconfirmed = require("../../../models/user_confirmed_model");

const SignupStrategy = new Strategy({passReqToCallback: true, usernameField: 'email'}, 
    
    function (req,email, password, done, res) {

    User.findOne({email}).lean().exec((err, user) => {

        if (err) {
            return done(err, null);
        }
        if (user) {
            return done('User already exist', null);
        }
        const encryptPassword = bcrypt.hashSync(password, salt);

        let newUser = new User({
            name:req.body.name,
            email,
            password:encryptPassword,
            verified:false
        });
        
        newUser.save((error, inserted) => {
            if (error) {
                return done(error, null);
            }   
            sendVerificationEmail(inserted, res);
            return done(null, inserted);
        });
    });
  });
    

const sendVerificationEmail = ({_id, email}, res) =>{  
    //If testing locally then it would be localhost, if on patentify website then it would be the URL for the actual patentify website.
    const currentUrl = "http://localhost:3000"; 
    const uniqueString = uuid() + _id;
    const mailOptions = {  
        from: "patentify.adm@gmail.com",
        to:email,
        subject: "Verify Your Email",
        html: `<p>Verify your email address to finish your account and be able to login.</p>
        <p>Click <a href=${currentUrl + "/users/verify/" + _id + "/" + uniqueString}>here</a> to finalize the process.</p>`,
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
    }).catch(() => {  
      
    })
  }
    
module.exports = SignupStrategy;
