export const extractCodeString = (code) => {
  if (typeof code === "string") return code;
  if (code && typeof code === "object") {
    if (typeof code.text === "string") return code.text;
    if (Array.isArray(code.lines)) {
      return code.lines.map((line) => line.text || "").join("\n");
    }
  }
  return String(code || "");
};

export const getEditorValue = (fileData) => extractCodeString(fileData);
