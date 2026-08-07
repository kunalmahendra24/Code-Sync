const express = require("express");
const router = express.Router();
const { executeCode } = require("../controllers/executionController");
const { checkDockerAvailable } = require("../docker/dockerRunner");
const { SUPPORTED_LANGUAGES } = require("../docker/languageConfig");
const { optionalAuth } = require("../middleware/authMiddleware");

router.get("/health", async (req, res) => {
  const dockerAvailable = await checkDockerAvailable();
  res.status(200).send({
    dockerAvailable,
    supportedLanguages: SUPPORTED_LANGUAGES,
  });
});

router.post("/", optionalAuth, executeCode);

module.exports = router;
