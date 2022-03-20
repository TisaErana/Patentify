const { Schema, model } = require("mongoose");

const patentSchema = new Schema(
  
  {
    documentId:{type:String, index: {unique: true, dropDups: true}},
    title:{type:String},
    abstract:{type:String},
    patentCorpus:{type:String}
  },

  { collection: "patents" }
);

module.exports = model("Patents", patentSchema);
