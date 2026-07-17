const express = require("express");
const router = express.Router();
const {
  getSpaces,
  createSpaces,
  updateSpaces,
  deleteSpaces,
  getSpaceData,
} = require("../controllers/spaceController");

const auth = require("../middleware/authMiddleware");

router.get("/", auth, getSpaces);
router.post("/", auth, createSpaces);
router.get("/:id", getSpaceData);
router.put("/:id", auth, updateSpaces);
router.delete("/:id", auth, deleteSpaces);

module.exports = router;
