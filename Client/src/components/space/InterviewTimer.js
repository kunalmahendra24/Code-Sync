import React, { useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import TimerIcon from "@mui/icons-material/Timer";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SettingsIcon from "@mui/icons-material/Settings";
import axiosConfig from "../../utils/axiosConfig";
import { formatTimer } from "../../utils/interviewHelpers";
import { PERMISSIONS } from "../../utils/permissions";
import useInterviewPermissions from "../../hooks/useInterviewPermissions";
import useInterviewTimer from "../../hooks/useInterviewTimer";
import { useDispatch } from "react-redux";
import { useTheme } from "@mui/material/styles";

const DURATION_OPTIONS = [
  { label: "30 min", value: 1800 },
  { label: "45 min", value: 2700 },
  { label: "60 min", value: 3600 },
  { label: "90 min", value: 5400 },
  { label: "120 min", value: 7200 },
];

function InterviewTimer({ interview, roomId, onStatusChange }) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { can } = useInterviewPermissions();
  const timer = interview?.timer;
  const { displaySeconds, isRunning } = useInterviewTimer(timer);
  const [showDuration, setShowDuration] = useState(false);

  const isLowTime = displaySeconds > 0 && displaySeconds <= 300;
  const isExpired = displaySeconds <= 0 && interview?.status === "completed";

  const handleDurationChange = async (durationSeconds) => {
    try {
      const res = await axiosConfig.put(`/interviews/${roomId}/timer`, {
        durationSeconds,
      });
      dispatch({ type: "updateInterview", payload: res.data });
      setShowDuration(false);
    } catch (e) {
      dispatch({
        type: "updateMessage",
        payload: {
          title: "Timer Error",
          data: e?.response?.data?.error || "Could not update timer duration",
        },
      });
    }
  };

  const canControl =
    can(PERMISSIONS.PAUSE_TIMER) ||
    can(PERMISSIONS.RESUME_TIMER) ||
    can(PERMISSIONS.START_INTERVIEW);

  const labelColor = theme.palette.text.primary;
  const mutedColor = theme.palette.text.secondary;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1,
        py: 0.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: isLowTime ? "warning.main" : "divider",
        bgcolor: isLowTime ? "warning.dark" : "action.hover",
        minWidth: canControl ? 180 : 120,
      }}
    >
      <TimerIcon
        fontSize="small"
        color={isLowTime ? "warning" : isExpired ? "error" : "action"}
      />

      <Box sx={{ flex: 1 }}>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 700,
            fontFamily: "monospace",
            lineHeight: 1.1,
            fontSize: "1rem",
            color: isLowTime ? "warning.contrastText" : "text.primary",
          }}
        >
          {formatTimer(displaySeconds)}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: isLowTime ? "warning.contrastText" : mutedColor,
            opacity: 0.9,
          }}
        >
          {isRunning ? "Running" : interview?.status === "paused" ? "Paused" : "Stopped"}
        </Typography>
      </Box>

      {!isRunning && interview?.status === "waiting" && (
        <Chip
          label="Not started"
          size="small"
          variant="outlined"
          sx={{ color: labelColor, borderColor: "divider" }}
        />
      )}

      {canControl && (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {interview?.status === "waiting" && can(PERMISSIONS.START_INTERVIEW) && (
            <Tooltip title="Start timer">
              <IconButton
                size="small"
                color="success"
                onClick={() => onStatusChange("in_progress")}
              >
                <PlayArrowIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {interview?.status === "in_progress" && can(PERMISSIONS.PAUSE_TIMER) && (
            <Tooltip title="Pause timer">
              <IconButton
                size="small"
                sx={{ color: labelColor }}
                onClick={() => onStatusChange("paused")}
              >
                <PauseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {interview?.status === "paused" && can(PERMISSIONS.RESUME_TIMER) && (
            <Tooltip title="Resume timer">
              <IconButton
                size="small"
                color="success"
                onClick={() => onStatusChange("in_progress")}
              >
                <PlayArrowIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {interview?.status === "waiting" && (
            <Tooltip title="Set duration">
              <IconButton
                size="small"
                sx={{ color: labelColor }}
                onClick={() => setShowDuration((prev) => !prev)}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      {showDuration && can(PERMISSIONS.START_INTERVIEW) && (
        <Select
          size="small"
          value={timer?.durationSeconds ?? 3600}
          onChange={(e) => handleDurationChange(e.target.value)}
          sx={{
            minWidth: 110,
            color: labelColor,
            ".MuiOutlinedInput-notchedOutline": { borderColor: "divider" },
            ".MuiSvgIcon-root": { color: labelColor },
          }}
        >
          {DURATION_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      )}
    </Box>
  );
}

export default InterviewTimer;
