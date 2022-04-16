const { Schema, model } = require("mongoose");

const svmMetricSchema = new Schema(
  
  {
    model_filename: { type: String },

    F1_scores: [ {
      score: { type: Number },
      date: { type: Date }
    } ],
    uncertain_F1_score: { type: Number },

    initializedAt: { type: Date },
    uncertainUpdatedAt: { type: Date }
  }
);

module.exports = model("SVM_Metrics", svmMetricSchema, "svm_metrics");
