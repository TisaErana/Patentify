const express = require("express");
const router = express.Router();
const passport = require("../auth/passport/index");
const User = require("../models/User_model");

/* GET users listing. */

router.get("/", async function (req, res, next) {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.json({ message: err });
  }
});

// Login Handle
router.post("/Login", function (req, res, next) {

  // Passport callback
  passport.authenticate("local-login", function (error, user, info) {

    if (error) {
      return res.status(500).json({
        message: error || "Oops something happened",
      });
    }
    
    // Persistent Login
    req.logIn(user, function(error){
      if(error) {
        return res.status(500).json({
          message: error || "Oops something happend"
        })
      }
      // Adds a property to object and lets us know that the user has been authenticated.
      user.isAuthenticated = true; 
  
      return res.json(user);

    });
    

  })(req, res, next);
});

// Signup Handle
router.post("/register", function (req, res, next) {

  // Passport callback
  passport.authenticate("local-signup", function (error, user, info) {
    
    if (error) {
      return res.status(500).json({
        message: error || "Oops something happened",
      });
    }

   // Persistent Login
   req.logIn(user, function(error){
    if(error) {
      return res.status(500).json({
        message: error || "Oops something happend"
      })
    }
    // Adds a property to object and lets us know that the user has been authenticated.
    user.isAuthenticated = true; 

    return res.json(user);

  });

    
  })(req, res, next);
});

router.post('/Forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          console.log('error', 'No account with that email address exists.');
          return res.redirect('/Forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport('SMTP', {
        service: 'SendGrid',
        auth: {
          user: 'patentify.adm@gmail.com',
          pass: 'Uspto_2020_$_$_$'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'patentify.adm@gmail.com',
        subject: 'Patentify password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/Forgot');
  });
});

router.post("/findUser", async function(req,res,next){
  const IDs = req.body.IDs
  let users = []
  let user;

  for(const id of IDs) {
    user = await User.find({_id: id}).catch((error) => {
      res.status(500).json({ error: error });
    });
    users.push(...user)
  }
  
  if(users.length > 0){
    res.status(200).json(users)
  }
  else{
    res.status(500).json({message:"error finding users of each queue"})
  }
})



module.exports = router;
