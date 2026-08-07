import React from "react";
import {
  Box,
  Chip,
  Divider,
  Typography,
  Paper,
  Stack,
} from "@mui/material";
import QuizIcon from "@mui/icons-material/Quiz";
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from "../../utils/questionHelpers";
import { PERMISSIONS } from "../../utils/permissions";
import useInterviewPermissions from "../../hooks/useInterviewPermissions";

function QuestionPanel({ question }) {
  const { can } = useInterviewPermissions();

  if (!can(PERMISSIONS.READ_QUESTION)) {
    return null;
  }

  if (!question?.title) {
    return (
      <Paper
        elevation={0}
        sx={{
          height: "100%",
          p: 2,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack alignItems="center" spacing={1}>
          <QuizIcon color="disabled" sx={{ fontSize: 40 }} />
          <Typography color="text.secondary" align="center">
            No question assigned yet.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        overflowY: "auto",
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <QuizIcon color="primary" fontSize="small" />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
          Question
        </Typography>
        {question.difficulty && (
          <Chip
            label={DIFFICULTY_LABELS[question.difficulty] || question.difficulty}
            color={DIFFICULTY_COLORS[question.difficulty] || "default"}
            size="small"
          />
        )}
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}>
        {question.title}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ whiteSpace: "pre-wrap", mb: 2 }}
      >
        {question.description}
      </Typography>

      {question.examples?.length > 0 && (
        <>
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}>
            Examples
          </Typography>
          <Stack spacing={1.5} sx={{ mb: 2 }}>
            {question.examples.map((example, index) => (
              <Box
                key={index}
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: "action.hover",
                  fontFamily: "monospace",
                  fontSize: 13,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Example {index + 1}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: "text.primary" }}>
                  <strong>Input:</strong> {example.input || "—"}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.primary" }}>
                  <strong>Output:</strong> {example.output || "—"}
                </Typography>
                {example.explanation && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {example.explanation}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        </>
      )}

      {question.constraints?.length > 0 && question.constraints.some(Boolean) && (
        <>
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}>
            Constraints
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5, mb: 2 }}>
            {question.constraints.filter(Boolean).map((constraint, index) => (
              <Typography component="li" variant="body2" key={index} color="text.secondary">
                {constraint}
              </Typography>
            ))}
          </Box>
        </>
      )}

      {(question.expectedInput || question.expectedOutput) && (
        <>
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "text.primary" }}>
            Expected I/O
          </Typography>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: "action.hover",
              fontFamily: "monospace",
              fontSize: 13,
            }}
          >
            <Typography variant="body2" sx={{ color: "text.primary" }}>
              <strong>Input:</strong> {question.expectedInput || "—"}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.primary" }}>
              <strong>Output:</strong> {question.expectedOutput || "—"}
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
}

export default QuestionPanel;
