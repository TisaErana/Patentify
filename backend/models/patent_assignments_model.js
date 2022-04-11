const { Schema, model } = require("mongoose");

const patentAssignmentSchema = new Schema(
  
  {
    user:{ type: Schema.Types.ObjectId, ref: "User", index: {unique: true, dropDups: true}},
    assignments: [
      {
        documentId:{type:String},
        title:{type:String},
        claims:{ type: [String] },
        abstract:{type:String},
        patentCorpus:{type:String}
      }
    ]
  },

  { collection: "patent_assignments" }
);

module.exports = model("PatentAssignment", patentAssignmentSchema);
