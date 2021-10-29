const { Schema, model } = require("mongoose");

const labelSchema = new Schema(
  
  {
    userId:{ type: Schema.Types.ObjectId, ref: "User"},
    items: [
        {type: String}
    ]
  }
);

module.exports = model("Queue", labelSchema, "queue");