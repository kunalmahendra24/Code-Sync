const Question = require("../models/questionSchema");

const createQuestion = async (userId, data) => {
  if (!data.title?.trim() || !data.description?.trim()) {
    throw new Error("Title and description are required");
  }

  const question = new Question({
    title: data.title.trim(),
    description: data.description.trim(),
    examples: data.examples || [],
    constraints: data.constraints || [],
    difficulty: data.difficulty || "medium",
    expectedInput: data.expectedInput || "",
    expectedOutput: data.expectedOutput || "",
    createdBy: userId,
  });

  await question.save();
  return question;
};

const getQuestions = async (userId) => {
  return Question.find({
    $or: [{ createdBy: userId }],
  })
    .select("title difficulty createdAt")
    .sort({ createdAt: -1 });
};

const getQuestionById = async (questionId) => {
  const question = await Question.findById(questionId);
  if (!question) {
    throw new Error("Question not found");
  }
  return question;
};

const updateQuestion = async (questionId, userId, data) => {
  const question = await getQuestionById(questionId);

  if (question.createdBy.toString() !== userId.toString()) {
    throw new Error("Not authorized to update this question");
  }

  if (data.title?.trim()) question.title = data.title.trim();
  if (data.description?.trim()) question.description = data.description.trim();
  if (data.examples) question.examples = data.examples;
  if (data.constraints) question.constraints = data.constraints;
  if (data.difficulty) question.difficulty = data.difficulty;
  if (data.expectedInput !== undefined) question.expectedInput = data.expectedInput;
  if (data.expectedOutput !== undefined) question.expectedOutput = data.expectedOutput;

  await question.save();
  return question;
};

module.exports = {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
};
