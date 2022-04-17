// Create Strategy
const Strategy = require("passport-local").Strategy;

// Import helpers for bycrpt
const bcrypt = require('bcryptjs');

const emailHelpers = require('../../../utils/sendEmail');

// Import models
const User = require("../../../models/user_model");

const LoginStrategy = new Strategy({ usernameField: 'email' },

  function (email, password, done, res) {

    User.findOne({email}).lean().exec((err, user) => {

        if (err) {
            return done(err, null);
        }

        if (!user) {
            return done('No User Found.', null);
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);

        if(!isPasswordValid)
        {
            return done("Email or Password Incorrect.", null);
        }

        if(!user.verified) 
        {
            emailHelpers.sendVerificationEmail(user, res);
            return done("Please confirm your email to login.", null);
        }

        return done(null,user);

    });
   
  });

module.exports = LoginStrategy;