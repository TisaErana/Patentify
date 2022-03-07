require('dotenv').config();
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const db = mongoose.connection.db
const crypto = require("crypto");
const User = require("../models/User_model");
const Token = require("../models/token");
const sendEmail = require("../utils/sendEmail");
const { schema } = require("../models/User_model");
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

router.get("/", async function (req, res, next) {
    try {
      const users = await User.find();
      res.json(users);
    } catch (err) {
      res.json({ message: err });
    }
  });
  
router.post("/", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (user == null)
            return res.status(400).json({ error: 'User with given email does not exist.'});
            let token = await Token.findOne({ userId: user._id });
        if (token) await token.deleteOne();
            token = await new Token({
                userId: user._id,
                token: crypto.randomBytes(32).toString("hex"),
                createdAt: Date.now(),
            }).save();
        
        

        const link = `http://localhost:3000/ResetPage`;
        await sendEmail(user.email, 'Patentify Password Reset', `Hello, please enter this code into the link below: ${token.token} \n ${link}`);

        res.send("password reset link sent to your email account");
    } catch (error) {
        res.send("An error occured");
        console.log(error);
    }
});

router.post("/", async (req, res) => {
    const resetPassword = async(userId, token, password) => {
        let passwordResetToken = await token.token.findOne({userId});
        if(passwordResetToken){
            throw new Error("Invalid or expired token");
        }
        const isValid = await(token == passwordResetToken.token);
        if(isValid){
            throw new Error("Invalid or expired token");
        }
        const encryptPassword = bcrypt.hashSync(password, salt);
        await User.updateOne(
            {_id: userId},
            { $set: {password: encryptPassword} },
            {new: true}
        );
        const user = await User.findById({_id: userId});
        sendEmail(
            user.email,
            "Password Reset Successful",
            {
                name: user.name
            },
      
       );
       await passwordResetToken.deleteOne();
       return true;
        
    };


})


module.exports = router;