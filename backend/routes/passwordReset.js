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
        if (user == null){
            console.log("Email doesnt exist");
            return res.status(400).json({ error: 'User with given email does not exist.'});
        }
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
        console.log("Password reset email sent")
        return link;
    } catch (error) {
        console.log(error);
        res.send("An error occured");
    }
});


router.post("/verify/update", async (req, res) =>{
    let inputToken= req.body.token;
    let token = await Token.findOne({ token:inputToken});
    if(!token){
        console.log("Token is not valid")
        res.send
    }
    if(token){
    let TokenUserId = token.userId;
    let user = await User.findOne({_id:TokenUserId});
    let newPassword = req.body.password
    const hashedPassword = bcrypt.hashSync(newPassword, salt);
    await User.updateOne(
        {_id : user._id  },
        { $set: {password: hashedPassword} }
        )
        let loginLink = 'http://localhost:3000/Login';
        await sendEmail(user.email, "Password reset confirmation", `Hello ${user.name} your password has been successfully updated, click the link below to login\n${loginLink}`);
        res.status(200).send('confirmation email sent');
        console.log("Reset confirmation email sent")

    }

});






module.exports = router;