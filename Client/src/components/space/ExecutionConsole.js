import React from "react";
import {
  Box,
  Chip,
  Divider,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import TerminalIcon from "@mui/icons-material/Terminal";
import InputIcon from "@mui/icons-material/Input";
import VisibilityIcon from "@mui/icons-material/Visibility";

function ExecutionConsole({
  result,
  loading,
  stdin,
  onStdinChange,
  expanded = false,
  watchMode = false,
  readOnlyInput = false,
}) {
  const runnerName =
    result?.executedBy?.name || result?.executionRecord?.executedBy?.name;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: watchMode ? "primary.main" : "divider",
        backgroundColor: "#0d1117",
        color: "#c9d1d9",
        display: "flex",
        flexDirection: "column",
        height: expanded ? "100%" : { xs: 240, sm: 280 },
        minHeight: expanded ? 280 : undefined,
        overflow: "hidden",
        flex: expanded ? 1 : "none",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TerminalIcon fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {watchMode ? "Live Console" : "Console"}
          </Typography>
          {watchMode && (
            <Chip
              icon={<VisibilityIcon />}
              label="Watching"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ color: "#c9d1d9", borderColor: "#30363d" }}
            />
          )}
        </Box>
        {result && (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {runnerName && (
              <Chip
                label={`Ran by ${runnerName}`}
                size="small"
                variant="outlined"
                sx={{ color: "#c9d1d9", borderColor: "#30363d" }}
              />
            )}
            {result.language && (
              <Chip
                label={result.language}
                size="small"
                variant="outlined"
                sx={{ color: "#c9d1d9", borderColor: "#30363d" }}
              />
            )}
            <Chip
              label={`${result.executionTimeMs ?? 0}ms`}
              size="small"
              variant="outlined"
              sx={{ color: "#c9d1d9", borderColor: "#30363d" }}
            />
            {result.memoryUsedKb && (
              <Chip
                label={`${Math.round(result.memoryUsedKb / 1024)}MB`}
                size="small"
                variant="outlined"
                sx={{ color: "#c9d1d9", borderColor: "#30363d" }}
              />
            )}
            <Chip
              label={result.success ? "Success" : "Error"}
              size="small"
              color={result.success ? "success" : "error"}
            />
          </Box>
        )}
      </Box>

      <Box
        sx={{
          flex: "1 1 50%",
          minHeight: 0,
          px: 1.5,
          py: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
          <InputIcon sx={{ fontSize: 16, color: "#8b949e" }} />
          <Typography variant="caption" sx={{ color: "#8b949e", fontWeight: 700 }}>
            Input
          </Typography>
        </Box>
        <TextField
          multiline
          minRows={3}
          fullWidth
          value={stdin}
          onChange={(e) => onStdinChange(e.target.value)}
          placeholder={
            readOnlyInput
              ? "Candidate input will appear here when they run code"
              : "Enter input for your program (e.g. 2 3 or one value per line)"
          }
          disabled={loading || readOnlyInput}
          InputProps={{ readOnly: readOnlyInput }}
          sx={{
            "& .MuiInputBase-root": {
              fontFamily: "monospace",
              fontSize: 13,
              color: "#c9d1d9",
              backgroundColor: "#161b22",
              alignItems: "flex-start",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#30363d",
            },
            "& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#58a6ff",
            },
            "& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#58a6ff",
            },
          }}
        />
      </Box>

      <Box
        sx={{
          flex: "1 1 50%",
          minHeight: 0,
          p: 1.5,
          fontFamily: "monospace",
          fontSize: 13,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {loading && (
          <Typography variant="body2" color="#8b949e">
            Running in Docker...
          </Typography>
        )}

        {!loading && !result && (
          <Typography variant="body2" color="#8b949e">
            {watchMode
              ? "Runs from anyone in the room appear here in real time."
              : "Output will appear here after you run code."}
          </Typography>
        )}

        {!loading && result?.compilationError && (
          <>
            <Typography variant="caption" sx={{ color: "#f85149", fontWeight: 700 }}>
              Compilation Error
            </Typography>
            <Typography
              component="pre"
              sx={{ whiteSpace: "pre-wrap", m: 0, mb: 1, color: "#f85149" }}
            >
              {result.compilationError}
            </Typography>
            <Divider sx={{ my: 1, borderColor: "#30363d" }} />
          </>
        )}

        {!loading && result?.runtimeError && !result?.compilationError && (
          <>
            <Typography variant="caption" sx={{ color: "#f85149", fontWeight: 700 }}>
              Runtime Error
            </Typography>
            <Typography
              component="pre"
              sx={{ whiteSpace: "pre-wrap", m: 0, mb: 1, color: "#f85149" }}
            >
              {result.runtimeError}
            </Typography>
            <Divider sx={{ my: 1, borderColor: "#30363d" }} />
          </>
        )}

        {!loading && result?.output && (
          <>
            <Typography variant="caption" sx={{ color: "#58a6ff", fontWeight: 700 }}>
              Output
            </Typography>
            <Typography
              component="pre"
              sx={{ whiteSpace: "pre-wrap", m: 0, color: "#c9d1d9" }}
            >
              {result.output}
            </Typography>
          </>
        )}

        {!loading &&
          result &&
          !result.output &&
          !result.compilationError &&
          !result.runtimeError &&
          result.success && (
            <Typography variant="body2" color="#8b949e">
              Program finished with no output.
            </Typography>
          )}
      </Box>
    </Paper>
  );
}

export default ExecutionConsole;
