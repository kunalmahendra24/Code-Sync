const { executeInDocker, checkDockerAvailable } = require("../docker/dockerRunner");
const { executeNatively } = require("../docker/nativeRunner");
const { SUPPORTED_LANGUAGES } = require("../docker/languageConfig");
const interviewRoomService = require("./interviewRoomService");
const { canExecuteCode } = require("../utils/permissions");

const extractCodeString = (code) => {
  if (typeof code === "string") return code;
  if (code && typeof code === "object") {
    if (typeof code.text === "string") return code.text;
    if (Array.isArray(code.lines)) {
      return code.lines.map((line) => line.text || "").join("\n");
    }
  }
  return String(code || "");
};

const validateExecutionPermission = async ({
  spaceId,
  executedBy,
  action,
}) => {
  const room = await interviewRoomService.getInterviewBySpaceId(spaceId);
  if (!room) return null;

  if (!canExecuteCode(room, executedBy)) {
    throw new Error("You do not have permission to run code in this interview");
  }

  return room;
};

const runCode = async ({
  spaceId,
  language,
  code,
  stdin,
  executedBy,
  action = "run",
}) => {
  if (!spaceId) {
    throw new Error("spaceId is required");
  }

  if (!language || !SUPPORTED_LANGUAGES.includes(language)) {
    throw new Error(
      `Unsupported language. Supported: ${SUPPORTED_LANGUAGES.join(", ")}`
    );
  }

  const sourceCode = extractCodeString(code);
  if (!sourceCode.trim()) {
    throw new Error("Code cannot be empty");
  }

  const room = await validateExecutionPermission({
    spaceId,
    executedBy,
    action,
  });

  const dockerAvailable = await checkDockerAvailable();
  const execute = dockerAvailable ? executeInDocker : executeNatively;

  const result = await execute({
    language,
    code: sourceCode,
    stdin: stdin || "",
  });

  const executionRecord = {
    language,
    code: sourceCode,
    stdin: stdin || "",
    output: result.output,
    error: result.error,
    compilationError: result.compilationError,
    runtimeError: result.runtimeError,
    success: result.success,
    executionTimeMs: result.executionTimeMs,
    memoryUsedKb: result.memoryUsedKb,
    executedAt: new Date(),
    executedBy: {
      name: executedBy?.name || "Unknown",
      email: executedBy?.email || null,
    },
  };

  if (room) {
    room.executionHistory.push(executionRecord);
    await room.save();
  }

  return {
    ...result,
    stdin: stdin || "",
    language,
    executedBy: executionRecord.executedBy,
    executionRecord,
    executionCount: room?.executionHistory?.length ?? 0,
  };
};

module.exports = {
  runCode,
  extractCodeString,
};
