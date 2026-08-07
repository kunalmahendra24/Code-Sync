const executionService = require("../services/executionService");
const { broadcastExecutionResult } = require("../socket/executionSocket");

let ioInstance = null;

const setSocketIO = (io) => {
  ioInstance = io;
};

const executeCode = async (req, res) => {
  try {
    const { spaceId, language, code, stdin, executedBy, action } = req.body;

    const resolvedExecutedBy = {
      name: executedBy?.name || req.user?.name,
      email: executedBy?.email || req.user?.email,
      userId: executedBy?.userId || req.user?._id || null,
    };

    const result = await executionService.runCode({
      spaceId,
      language,
      code,
      stdin,
      executedBy: resolvedExecutedBy,
      action: action || "run",
    });

    if (ioInstance && spaceId) {
      broadcastExecutionResult(ioInstance, spaceId, result);
    }

    res.status(200).send(result);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

module.exports = {
  executeCode,
  setSocketIO,
};
