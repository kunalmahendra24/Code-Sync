import React, { useState } from "react";
import {
  Box,
  Chip,
  Divider,
  Typography,
  Button,
  Stack,
  Snackbar,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import CodeIcon from "@mui/icons-material/Code";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import AssessmentIcon from "@mui/icons-material/Assessment";
import QuizIcon from "@mui/icons-material/Quiz";
import axiosConfig from "../../utils/axiosConfig";
import ChangeQuestionDialog from "./ChangeQuestionDialog";
import InterviewTimer from "./InterviewTimer";
import {
  formatTimer,
  STATUS_COLORS,
  STATUS_LABELS,
} from "../../utils/interviewHelpers";
import { PERMISSIONS } from "../../utils/permissions";
import useInterviewPermissions from "../../hooks/useInterviewPermissions";
import { useDispatch } from "react-redux";
import { useTheme } from "@mui/material/styles";

function InterviewPanel({ interview, roomId }) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { can, userRole } = useInterviewPermissions();
  const [reportOpen, setReportOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!interview) return null;

  const labelColor = theme.palette.text.primary;
  const mutedColor = theme.palette.text.secondary;

  const handleStatusChange = async (status) => {
    try {
      const res = await axiosConfig.put(`/interviews/${roomId}/status`, {
        status,
      });
      dispatch({ type: "updateInterview", payload: res.data });
    } catch (e) {
      setErrorMessage(
        e?.response?.data?.error || "Could not update interview status"
      );
      setError(true);
    }
  };

  const handleKickCandidate = async () => {
    try {
      const res = await axiosConfig.put(`/interviews/${roomId}/kick`);
      dispatch({ type: "updateInterview", payload: res.data });
    } catch (e) {
      setErrorMessage(e?.response?.data?.error || "Could not kick candidate");
      setError(true);
    }
  };

  const handleViewReport = async () => {
    try {
      const res = await axiosConfig.get(`/interviews/${roomId}/report`);
      setReport(res.data);
      setReportOpen(true);
    } catch (e) {
      setErrorMessage(e?.response?.data?.error || "Could not load report");
      setError(true);
    }
  };

  return (
    <>
      <Snackbar
        open={error}
        onClose={() => setError(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        autoHideDuration={3000}
      >
        <Alert variant="filled" severity="error" sx={{ width: "100%" }}>
          <AlertTitle>Error</AlertTitle>
          {errorMessage}
        </Alert>
      </Snackbar>

      <ChangeQuestionDialog
        open={questionDialogOpen}
        onClose={() => setQuestionDialogOpen(false)}
        roomId={roomId}
        onQuestionAssigned={(data) =>
          dispatch({ type: "updateInterview", payload: data })
        }
      />

      <Dialog open={reportOpen} onClose={() => setReportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Interview Report</DialogTitle>
        <DialogContent dividers>
          {report && (
            <Stack spacing={1}>
              <Typography><strong>Title:</strong> {report.title}</Typography>
              <Typography><strong>Status:</strong> {STATUS_LABELS[report.status]}</Typography>
              <Typography><strong>Candidate:</strong> {report.candidate?.name || "None"}</Typography>
              <Typography><strong>Executions:</strong> {report.executionCount}</Typography>
              <Typography><strong>Duration:</strong> {formatTimer(report.durationSeconds)}</Typography>
              <Typography><strong>Remaining:</strong> {formatTimer(report.remainingSeconds)}</Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Box
        sx={{
          backgroundColor: "background.paper",
          borderRadius: 2,
          p: 1,
          mb: 0.5,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 0.75,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, color: labelColor }}
            >
              {interview.title}
            </Typography>
            <Chip
              label={STATUS_LABELS[interview.status] || interview.status}
              color={STATUS_COLORS[interview.status] || "default"}
              size="small"
              sx={
                STATUS_COLORS[interview.status]
                  ? undefined
                  : { color: labelColor, borderColor: "divider" }
              }
            />
            {userRole && (
              <Chip
                label={userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                variant="outlined"
                size="small"
                color={userRole === "interviewer" ? "primary" : "secondary"}
                sx={{ color: labelColor }}
              />
            )}
          </Box>

          <InterviewTimer
            interview={interview}
            roomId={roomId}
            onStatusChange={handleStatusChange}
          />
        </Box>

        <Divider sx={{ my: 0.75 }} />

        <Stack
          direction="row"
          spacing={2}
          sx={{ mb: 0.75, flexWrap: "wrap", rowGap: 0.5 }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <PersonIcon sx={{ fontSize: 16, color: "primary.main" }} />
            <Typography variant="caption" sx={{ color: labelColor }}>
              <strong>Interviewer:</strong> {interview.interviewer?.name}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <PersonIcon sx={{ fontSize: 16, color: "secondary.main" }} />
            <Typography variant="caption" sx={{ color: labelColor }}>
              <strong>Candidate:</strong>{" "}
              {interview.candidate?.name || "Waiting..."}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <CodeIcon sx={{ fontSize: 16, color: mutedColor }} />
            <Typography variant="caption" sx={{ color: labelColor }}>
              <strong>Runs:</strong> {interview.executionHistory?.length ?? 0}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          {can(PERMISSIONS.CHANGE_QUESTION) && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<QuizIcon />}
              onClick={() => setQuestionDialogOpen(true)}
            >
              {interview.question?.title ? "Change Question" : "Assign Question"}
            </Button>
          )}
          {can(PERMISSIONS.START_INTERVIEW) &&
            interview.status === "waiting" && (
              <Button
                size="small"
                variant="contained"
                onClick={() => handleStatusChange("in_progress")}
              >
                Start Interview
              </Button>
            )}
          {can(PERMISSIONS.END_INTERVIEW) &&
            ["in_progress", "paused", "waiting"].includes(interview.status) && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => handleStatusChange("completed")}
              >
                End Interview
              </Button>
            )}
          {can(PERMISSIONS.KICK_CANDIDATE) && interview.candidate?.name && (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              startIcon={<PersonOffIcon />}
              onClick={handleKickCandidate}
            >
              Kick Candidate
            </Button>
          )}
          {can(PERMISSIONS.VIEW_REPORTS) && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<AssessmentIcon />}
              onClick={handleViewReport}
            >
              View Report
            </Button>
          )}
        </Box>
      </Box>
    </>
  );
}

export default InterviewPanel;
