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

router.post("/", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (user == null)
            return res.status(400).json({ error: 'User with given email does not exist.'});
            let token = await Token.findOne({ userId: user._id });
        if (token) await token.deleteOne();
        let resetToken = crypto.randomBytes(32).toString("hex");
        const hash= await bcrypt.hash(resetToken, salt);
            
           await new Token({
                userId: user._id,
                token: hash,
                createdAt: Date.now(),
            }).save();
        
        

        const link = `http://localhost:3000/ResetPage?token=${resetToken}&id=${user._id}`;
        await sendEmail(user.email, 'Patentify Password Reset', `Hello ${user.name} , Please click the link below to reset your password\n ${link}`);
        res.send("password reset link sent to your email account");
        return link;
    } catch (error) {
        res.send("An error occured");
        console.log(error);
    }
});

    const resetPassword = async (userId, token, password) => {
    let passwordResetToken = await Token.findOne({userId});
    if (!passwordResetToken){
        throw new Error("Invalid or expired token");
    }

    const isValid = await bcrypt.compare(token, passwordResetToken.token);
    if(!isValid){
        throw new Error("Invalid or expired token");
    }
    const hash = await bcrypt.hash(password, salt);
    await User.updateOne(
        {_id: userId},
        { $set: { password: hash } }
    );

};


module.exports = router;