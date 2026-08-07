const questionService = require("../services/questionService");

const getQuestions = async (req, res) => {
  try {
    const questions = await questionService.getQuestions(req.user._id);
    res.status(200).send(questions);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const createQuestion = async (req, res) => {
  try {
    const question = await questionService.createQuestion(req.user._id, req.body);
    res.status(201).send(question.publicQuestionData());
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const getQuestion = async (req, res) => {
  try {
    const question = await questionService.getQuestionById(req.params.id);
    res.status(200).send(question.publicQuestionData());
  } catch (e) {
    res.status(404).send({ error: e.message });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const question = await questionService.updateQuestion(
      req.params.id,
      req.user._id,
      req.body
    );
    res.status(200).send(question.publicQuestionData());
  } catch (e) {
    res.status(403).send({ error: e.message });
  }
};

module.exports = {
  getQuestions,
  createQuestion,
  getQuestion,
  updateQuestion,
};
