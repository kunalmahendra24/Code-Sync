const mongoose = require("mongoose");

const DIFFICULTY_LEVELS = ["easy", "medium", "hard"];

const questionSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    examples: [
      {
        input: { type: String, default: "" },
        output: { type: String, default: "" },
        explanation: { type: String, default: "" },
      },
    ],
    constraints: {
      type: [String],
      default: [],
    },
    difficulty: {
      type: String,
      enum: DIFFICULTY_LEVELS,
      default: "medium",
    },
    expectedInput: {
      type: String,
      default: "",
    },
    expectedOutput: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

questionSchema.methods.publicQuestionData = function () {
  const question = this;

  return {
    _id: question._id,
    title: question.title,
    description: question.description,
    examples: question.examples,
    constraints: question.constraints,
    difficulty: question.difficulty,
    expectedInput: question.expectedInput,
    expectedOutput: question.expectedOutput,
    createdBy: question.createdBy,
    createdAt: question.createdAt,
  };
};

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;
module.exports.DIFFICULTY_LEVELS = DIFFICULTY_LEVELS;
