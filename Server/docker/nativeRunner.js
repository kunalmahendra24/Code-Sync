const { spawn } = require("child_process");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { getLanguageConfig } = require("./languageConfig");

const EXECUTION_TIMEOUT_MS = Number(process.env.EXECUTION_TIMEOUT_MS || 15000);
const RUN_TIMEOUT_MS = Number(process.env.RUN_TIMEOUT_MS || 5000);
const COMPILED_LANGUAGES = new Set(["cpp", "java"]);
const EXECUTION_TEMP_ROOT = path.join(__dirname, "..", "temp", "executions");

const NATIVE_COMMANDS = {
  javascript: {
    run: (workDir) => ({
      shell: `cd "${workDir}" && node main.js 2>&1`,
      timeoutMs: RUN_TIMEOUT_MS,
    }),
  },
  python: {
    run: (workDir) => ({
      shell: `cd "${workDir}" && python3 main.py 2>&1`,
      timeoutMs: RUN_TIMEOUT_MS,
    }),
  },
  cpp: {
    compile: (workDir) => ({
      shell: `cd "${workDir}" && g++ -O2 -o main main.cpp 2>&1`,
      timeoutMs: EXECUTION_TIMEOUT_MS,
    }),
    run: (workDir, stdinRedirect) => ({
      shell: `cd "${workDir}" && ./main${stdinRedirect} 2>&1`,
      timeoutMs: RUN_TIMEOUT_MS,
    }),
  },
  java: {
    compile: (workDir) => ({
      shell: `cd "${workDir}" && javac Main.java 2>&1`,
      timeoutMs: EXECUTION_TIMEOUT_MS,
    }),
    run: (workDir, stdinRedirect) => ({
      shell: `cd "${workDir}" && java Main${stdinRedirect} 2>&1`,
      timeoutMs: RUN_TIMEOUT_MS,
    }),
  },
};

const ensureExecutionTempRoot = async () => {
  await fs.mkdir(EXECUTION_TEMP_ROOT, { recursive: true });
};

const runShell = (shellCommand, timeoutMs = EXECUTION_TIMEOUT_MS) =>
  new Promise((resolve) => {
    const child = spawn("sh", ["-c", shellCommand], {
      stdio: ["ignore", "pipe", "pipe"],
    });

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

const executeNatively = async ({ language, code, stdin = "" }) => {
  const config = getLanguageConfig(language);
  const native = NATIVE_COMMANDS[language];

  if (!native) {
    throw new Error(`Native execution not configured for: ${language}`);
  }

  let workDir = "";
  const startedAt = Date.now();

  try {
    await ensureExecutionTempRoot();
    workDir = await fs.mkdtemp(
      path.join(EXECUTION_TEMP_ROOT, `native-${crypto.randomUUID()}-`)
    );

    await fs.writeFile(path.join(workDir, config.filename), code, "utf8");

    if (stdin) {
      await fs.writeFile(path.join(workDir, "input.txt"), stdin, "utf8");
    }

    const stdinRedirect = stdin ? " < input.txt" : "";

    if (COMPILED_LANGUAGES.has(language) && native.compile) {
      const compileCommand = native.compile(workDir);
      const compileResult = await runShell(
        compileCommand.shell,
        compileCommand.timeoutMs
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

    const runCommand = native.run(workDir, stdinRedirect);
    const runResult = await runShell(runCommand.shell, runCommand.timeoutMs);
    const executionTimeMs = Date.now() - startedAt;

    if (runResult.timedOut) {
      return formatTimeoutResult("Execution", startedAt, runResult.stdout);
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

module.exports = {
  executeNatively,
};
