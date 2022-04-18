const { Schema, model } = require("mongoose");

const uncertainPatentSchema = new Schema(
  
  {
    documentId:{type:String, index: {unique: true, dropDups: true}},
    title:{type:String},
    date:{type:String},
    claims:{ type: [String] },
    abstract:{type:String},
    patentCorpus:{type:String}
  },

  { collection: "uncertain_patents" }
);

module.exports = model("UncertainPatent", uncertainPatentSchema);