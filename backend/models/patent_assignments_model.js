const { Schema, model } = require("mongoose");

const patentAssignmentSchema = new Schema(
  
  {
    user:{ type: Schema.Types.ObjectId, ref: "User", index: {unique: true, dropDups: true}},
    assignments: [{type: Object}]
  },

  { collection: "patent_assignments" }
);

module.exports = model("PatentAssignment", patentAssignmentSchema);
