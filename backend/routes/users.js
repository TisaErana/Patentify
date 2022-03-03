const express = require("express");
const router = express.Router();
const passport = require("../auth/passport/index");
const { User, validate } = require("../models/User_model");

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

router.post("/", async (req, res) => {
  try {
      const { error } = validate(req.body);
      if (error) return res.status(400).send(error.details[0].message);

      const user = await new User(req.body).save();

      res.send(user);
  } catch (error) {
      res.send("An error occured");
      console.log(error);
  }
});


module.exports = router;
