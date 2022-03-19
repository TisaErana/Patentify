const { Schema, model } = require("mongoose");

const patentSchema = new Schema(
  
  {
    documentId:{type:String, index: true},
    cpc:{type:String},
    title:{type:String},
    claims:{type:String},
    abstract:{type:String},
    patentCorpus:{type:String}
  },

  { collection: "patents" }
);

module.exports = model("Patents", patentSchema);
