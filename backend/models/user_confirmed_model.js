const { Schema, model } = require("mongoose");

const UserConfirmedSchema = new Schema({
    userId: String,
    uniqueString: String,
})

module.exports = model("UserConfirmed",UserConfirmedSchema);