const { Schema, model } = require("mongoose");

const patentSchema = new Schema(
  
  {
    documentId:{type:String},
    patentCorpus:{type:String}
  },

  { collection: "patents" }
);

module.exports = model("Patents", patentSchema, "Patents");
