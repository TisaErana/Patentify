// Create Strategy
const Strategy = require("passport-local").Strategy;
const nodemailer = require("nodemailer");
// Import helpers for bycrpt
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

const emailHelpers = require('../../../utils/sendEmail');

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
            emailHelpers.sendVerificationEmail(inserted, res);
            return done(null, inserted);
        });
    });
  });
    
module.exports = SignupStrategy;
