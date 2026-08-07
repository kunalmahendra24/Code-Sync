const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { optionalAuth } = require("../middleware/authMiddleware");
const {
  getInterviews,
  createInterview,
  getInterviewData,
  joinInterview,
  updateStatus,
  kickCandidate,
  getReport,
  updateQuestion,
  updateTimer,
  deleteInterview,
} = require("../controllers/interviewRoomController");

router.get("/", auth, getInterviews);
router.post("/", auth, createInterview);
router.get("/:id/report", auth, getReport);
router.get("/:id", optionalAuth, getInterviewData);
router.put("/:id/join", optionalAuth, joinInterview);
router.put("/:id/status", auth, updateStatus);
router.put("/:id/kick", auth, kickCandidate);
router.put("/:id/question", auth, updateQuestion);
router.put("/:id/timer", auth, updateTimer);
router.delete("/:id", auth, deleteInterview);

module.exports = router;
