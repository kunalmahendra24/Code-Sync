const LANGUAGE_CONFIG = {
  javascript: {
    image: "node:20-alpine",
    filename: "main.js",
    buildCommand: "cd /work",
    runCommand: "timeout 5s node main.js",
  },
  python: {
    image: "python:3.11-alpine",
    filename: "main.py",
    buildCommand: "cd /work",
    runCommand: "timeout 5s python main.py",
  },
  cpp: {
    image: "gcc:13",
    filename: "main.cpp",
    buildCommand: "cd /work && g++ -O2 -o main main.cpp",
    runCommand: "timeout 5s ./main",
  },
  java: {
    image: "eclipse-temurin:17-jdk",
    filename: "Main.java",
    buildCommand: "cd /work && javac Main.java",
    runCommand: "timeout 5s java Main",
  },
};

const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_CONFIG);

const getLanguageConfig = (language) => {
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }
  return config;
};

module.exports = {
  LANGUAGE_CONFIG,
  SUPPORTED_LANGUAGES,
  getLanguageConfig,
};
