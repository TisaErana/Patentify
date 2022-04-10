const { Schema, model } = require("mongoose");

const svmCommandSchema = new Schema(
  
  {
    command: { type: String }
  }
);

module.exports = model("SVM_Command", svmCommandSchema, "svm_command");
