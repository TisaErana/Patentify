require('dotenv').config();
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const db = mongoose.connection.db
const crypto = require("crypto");
const User = require("../models/User_model");
const Token = require("../models/token");
const sendEmail = require("../utils/sendEmail");
const { UserSchema } = require("../models/User_model");
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

router.post("/requestPasswordLink", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (user == null)
            return res.status(400).json({ error: 'User with given email does not exist.'});
            let token = await Token.findOne({ userId: user._id });
        if (token) await token.deleteOne();
        let resetToken = crypto.randomBytes(32).toString("hex");
            
           await new Token({
                userId: user._id,
                token: resetToken,
                createdAt: Date.now(),
            }).save();
        
        const currentUrl = "http://localhost:3000"

        const link = `${currentUrl}/ResetPage`;
        await sendEmail(user.email, 'Patentify Password Reset', `Hello ${user.name} , Please click the link below enter code below to reset your password\n ${link}\n${resetToken}`);
        res.send("password reset link sent to your email account");
        return link;
    } catch (error) {
        res.send("An error occured");
        console.log(error);
    }
});


router.post("/verify/update", async (req, res) =>{
    let inputToken= req.body.token;
    let token = await Token.findOne({ token:inputToken});
    let TokenUserId = token.userId;
    console.log("UserId VARIABLE = token.userId : " + TokenUserId);
    let user = await User.findOne({_id:TokenUserId});
    console.log("user id : " + user._id);
    let newPassword = req.body.password
    console.log("New password = " + newPassword);
    if(!token){
        console.log("Token is not valid")
        throw new Error("Invalid token");
    }
    console.log("new Password: " + newPassword);
    const hashedPassword = bcrypt.hashSync(newPassword, salt);
    console.log("Hashed Password: " + hashedPassword);
    await User.updateOne(
        {_id : user._id  },
        { $set: {password: hashedPassword} }
        )
    

});






module.exports = router;