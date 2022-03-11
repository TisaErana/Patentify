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
        if (user === null){
            return res.status(400).send('User with email does not exist\nPlease enter email again');
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
        await sendEmail(user.email, 'Patentify Password Reset', `Hello ${user.name},
                                    \nPlease follow instructions below to reset your password
                                    \nIf you did not request a password reset, please disregard this email: 
                                    \nClick here to reset password:${link}
                                    \nCopy this code and paste in link above:${resetToken}`);
        return res.status(200).send("password reset link sent\nPlease check email for instructions");
    } catch (error) {
        console.log(error);
        res.send("An error occured");
    }
});


router.post("/verify/update", async (req, res) =>{
    let inputToken= req.body.token;
    let token = await Token.findOne({ token:inputToken});
    if(!token){
        return res.status(400).send('Token is not valid\nPlease re-enter token');
    }
    if(token){
    let TokenUserId = token.userId;
    let user = await User.findOne({_id:TokenUserId});
    let newPassword = req.body.password;
    let passwordConf = req.body.passwordConfirm;

    if(newPassword === passwordConf){
    const hashedPassword = bcrypt.hashSync(newPassword, salt);
    await User.updateOne(
        {_id : user._id  },
        { $set: {password: hashedPassword} }
        )
        let loginLink = 'http://localhost:3000/Login';
        await sendEmail(user.email, "Password reset confirmation", `Hello ${user.name} your password has been successfully updated, click the link below to login.\n${loginLink}`);
        res.status(200).send('Password Reset successfuly');

    }else{
        return res.status(400).send('Passwords do not match\nPlease re-enter password');
}


}

});






module.exports = router;