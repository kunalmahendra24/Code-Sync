const { spawn } = require("child_process");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { getLanguageConfig } = require("./languageConfig");

const DOCKER_MEMORY = process.env.DOCKER_MEMORY_LIMIT || "128m";
const DOCKER_CPUS = process.env.DOCKER_CPU_LIMIT || "0.5";
const EXECUTION_TIMEOUT_MS = Number(process.env.EXECUTION_TIMEOUT_MS || 15000);
const COMPILED_LANGUAGES = new Set(["cpp", "java"]);
const EXECUTION_TEMP_ROOT = path.join(__dirname, "..", "temp", "executions");

const ensureExecutionTempRoot = async () => {
  await fs.mkdir(EXECUTION_TEMP_ROOT, { recursive: true });
};

const runProcess = (command, args, timeoutMs) =>
  new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code,
        signal,
        timedOut,
      });
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({
        stdout: "",
        stderr: error.message,
        exitCode: 1,
        signal: null,
        timedOut: false,
      });
    });
  });

const buildDockerArgs = (workDir, image, shellCommand) => [
  "run",
  "--rm",
  "--network",
  "none",
  "--memory",
  DOCKER_MEMORY,
  "--memory-swap",
  DOCKER_MEMORY,
  "--cpus",
  DOCKER_CPUS,
  "--pids-limit",
  "64",
  "--read-only",
  "-v",
  `${workDir}:/work:rw`,
  image,
  "sh",
  "-c",
  shellCommand,
];

const runDockerCommand = (workDir, image, shellCommand) =>
  runProcess(
    "docker",
    buildDockerArgs(workDir, image, shellCommand),
    EXECUTION_TIMEOUT_MS
  );

const formatTimeoutResult = (phase, startedAt, partialOutput = "") => ({
  success: false,
  output: partialOutput,
  error: `${phase} timed out (5s limit exceeded)`,
  compilationError: phase === "Compilation" ? `${phase} timed out` : "",
  runtimeError: phase === "Execution" ? `${phase} timed out (5s limit exceeded)` : "",
  executionTimeMs: Date.now() - startedAt,
  memoryUsedKb: null,
  exitCode: 124,
});

const executeInDocker = async ({ language, code, stdin = "" }) => {
  const config = getLanguageConfig(language);
  let workDir = "";

  const startedAt = Date.now();

  try {
    await ensureExecutionTempRoot();
    workDir = await fs.mkdtemp(
      path.join(EXECUTION_TEMP_ROOT, `run-${crypto.randomUUID()}-`)
    );

    await fs.writeFile(path.join(workDir, config.filename), code, "utf8");

    if (stdin) {
      await fs.writeFile(path.join(workDir, "input.txt"), stdin, "utf8");
    }

    const stdinRedirect = stdin ? " < /work/input.txt" : "";

    if (COMPILED_LANGUAGES.has(language)) {
      const compileResult = await runDockerCommand(
        workDir,
        config.image,
        `${config.buildCommand} 2>&1`
      );

      if (compileResult.timedOut) {
        return formatTimeoutResult(
          "Compilation",
          startedAt,
          compileResult.stdout
        );
      }

      if (compileResult.exitCode !== 0) {
        const compileOutput =
          compileResult.stderr || compileResult.stdout || "Compilation failed";
        return {
          success: false,
          output: compileResult.stdout,
          error: compileOutput,
          compilationError: compileOutput,
          runtimeError: "",
          executionTimeMs: Date.now() - startedAt,
          memoryUsedKb: null,
          exitCode: compileResult.exitCode,
        };
      }
    }

    const runShell = `${config.buildCommand} && ${config.runCommand}${stdinRedirect} 2>&1`;
    const runResult = await runDockerCommand(workDir, config.image, runShell);
    const executionTimeMs = Date.now() - startedAt;

    if (runResult.timedOut) {
      return formatTimeoutResult("Execution", startedAt, runResult.stdout);
    }

    if (runResult.exitCode === 137) {
      return {
        success: false,
        output: runResult.stdout,
        error: "Memory limit exceeded",
        compilationError: "",
        runtimeError: "Memory limit exceeded (128MB)",
        executionTimeMs,
        memoryUsedKb: 131072,
        exitCode: runResult.exitCode,
      };
    }

    const combinedOutput = [runResult.stdout, runResult.stderr]
      .filter(Boolean)
      .join("\n");
    const hasRuntimeError = runResult.exitCode !== 0;

    return {
      success: !hasRuntimeError,
      output: runResult.stdout,
      error: hasRuntimeError ? combinedOutput : "",
      compilationError: "",
      runtimeError: hasRuntimeError ? combinedOutput : "",
      executionTimeMs,
      memoryUsedKb: null,
      exitCode: runResult.exitCode,
    };
  } catch (error) {
    return {
      success: false,
      output: "",
      error: error.message,
      compilationError: "",
      runtimeError: error.message,
      executionTimeMs: Date.now() - startedAt,
      memoryUsedKb: null,
      exitCode: 1,
    };
  } finally {
    if (workDir) {
      await fs.rm(workDir, { recursive: true, force: true });
    }
  }
};

const checkDockerAvailable = async () => {
  const result = await runProcess("docker", ["info"], 5000);
  return result.exitCode === 0;
};

module.exports = {
  executeInDocker,
  checkDockerAvailable,
};
