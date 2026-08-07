const ACTIONS = require("../Actions");

const broadcastExecutionResult = (io, spaceId, result) => {
  io.to(spaceId).emit(ACTIONS.CODE_EXECUTION_RESULT, result);
  io.to(`interview:${spaceId}`).emit(ACTIONS.CODE_EXECUTION_RESULT, result);
};

module.exports = { broadcastExecutionResult };
