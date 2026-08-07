const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getQuestions,
  createQuestion,
  getQuestion,
  updateQuestion,
} = require("../controllers/questionController");

router.get("/", auth, getQuestions);
router.post("/", auth, createQuestion);
router.get("/:id", auth, getQuestion);
router.put("/:id", auth, updateQuestion);

module.exports = router;
