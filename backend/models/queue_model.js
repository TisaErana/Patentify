const { Schema, model } = require("mongoose");

const queueSchema = new Schema(
  {
    userId:{ type: Schema.Types.ObjectId, ref: "User"},
    cpc:{type:String},
    title:{type:String},
    claims:{type:String},
    abstract:{type:String},
    documentId:{type:String},
    patentCorpus:{type:String},
    updatedAt: { type: Date, expires: 864000, default: Date.now } // expires in 10 days.
  }
);

module.exports = model("Queue", queueSchema, "queue");