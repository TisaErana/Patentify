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
