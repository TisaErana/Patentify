const { Schema, model } = require("mongoose");

const svmMetricSchema = new Schema(
  
  {
    model_filename: { type: String },

    init_F1_score: { type: Number },
    uncertain_F1_score: { type: Number },
    current_F1_score: { type: Number },

    updatedAt: { type: Date },
    initializedAt: { type: Date },
    uncertainUpdatedAt: { type: Date }
  }
);

module.exports = model("SVM_Metrics", svmMetricSchema, "svm_metrics");
