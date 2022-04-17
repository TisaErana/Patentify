const { Schema, model } = require("mongoose");

const unlabeledPatentsSchema = new Schema(
  
  {
    documentId:{type:String, index: {unique: true, dropDups: true}}
  },

  { collection: "unlabeled_patents" }
);

module.exports = model("UnlabeledPatents", unlabeledPatentsSchema);
