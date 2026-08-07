import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import axiosConfig from "../../utils/axiosConfig";
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS, EMPTY_QUESTION_FORM } from "../../utils/questionHelpers";

function ChangeQuestionDialog({ open, onClose, roomId, onQuestionAssigned }) {
  const [tab, setTab] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_QUESTION_FORM);

  useEffect(() => {
    if (!open) return;

    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const res = await axiosConfig.get("/questions");
        setQuestions(res.data);
      } catch {
        setError("Could not load questions");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
    setForm(EMPTY_QUESTION_FORM);
    setTab(0);
    setError("");
  }, [open]);

  const assignQuestion = async (payload) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await axiosConfig.put(`/interviews/${roomId}/question`, payload);
      onQuestionAssigned(res.data);
      onClose();
    } catch (e) {
      setError(e?.response?.data?.error || "Could not assign question");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignExisting = (questionId) => {
    assignQuestion({ questionId });
  };

  const handleCreateAndAssign = () => {
    assignQuestion({
      ...form,
      constraints: form.constraints.filter(Boolean),
      examples: form.examples.filter((ex) => ex.input || ex.output),
    });
  };

  const updateExample = (index, field, value) => {
    const examples = [...form.examples];
    examples[index] = { ...examples[index], [field]: value };
    setForm({ ...form, examples });
  };

  const addExample = () => {
    setForm({
      ...form,
      examples: [...form.examples, { input: "", output: "", explanation: "" }],
    });
  };

  const removeExample = (index) => {
    setForm({
      ...form,
      examples: form.examples.filter((_, i) => i !== index),
    });
  };

  const updateConstraint = (index, value) => {
    const constraints = [...form.constraints];
    constraints[index] = value;
    setForm({ ...form, constraints });
  };

  const addConstraint = () => {
    setForm({ ...form, constraints: [...form.constraints, ""] });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Change Question
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ px: 3 }}>
        <Tab label="Question Bank" />
        <Tab label="Create New" />
      </Tabs>

      <DialogContent dividers>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {tab === 0 && (
          <Box>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : questions.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No questions yet. Create one in the &quot;Create New&quot; tab.
              </Typography>
            ) : (
              <List>
                {questions.map((q) => (
                  <ListItemButton
                    key={q._id}
                    onClick={() => handleAssignExisting(q._id)}
                    disabled={submitting}
                    sx={{ borderRadius: 1, mb: 0.5 }}
                  >
                    <ListItemText
                      primary={q.title}
                      secondary={new Date(q.createdAt).toLocaleDateString()}
                    />
                    <Chip
                      label={DIFFICULTY_LABELS[q.difficulty] || q.difficulty}
                      color={DIFFICULTY_COLORS[q.difficulty] || "default"}
                      size="small"
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Problem Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              fullWidth
              multiline
              minRows={4}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={form.difficulty}
                label="Difficulty"
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              >
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>

            <Divider />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Examples
            </Typography>
            {form.examples.map((example, index) => (
              <Box key={index} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                  <TextField
                    label={`Example ${index + 1} Input`}
                    value={example.input}
                    onChange={(e) => updateExample(index, "input", e.target.value)}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label={`Example ${index + 1} Output`}
                    value={example.output}
                    onChange={(e) => updateExample(index, "output", e.target.value)}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Explanation (optional)"
                    value={example.explanation}
                    onChange={(e) => updateExample(index, "explanation", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Box>
                {form.examples.length > 1 && (
                  <IconButton onClick={() => removeExample(index)} color="error">
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
            <Button startIcon={<AddIcon />} onClick={addExample} size="small">
              Add Example
            </Button>

            <Divider />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Constraints
            </Typography>
            {form.constraints.map((constraint, index) => (
              <TextField
                key={index}
                label={`Constraint ${index + 1}`}
                value={constraint}
                onChange={(e) => updateConstraint(index, e.target.value)}
                fullWidth
                size="small"
              />
            ))}
            <Button startIcon={<AddIcon />} onClick={addConstraint} size="small">
              Add Constraint
            </Button>

            <Divider />
            <TextField
              label="Expected Input"
              value={form.expectedInput}
              onChange={(e) => setForm({ ...form, expectedInput: e.target.value })}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Expected Output"
              value={form.expectedOutput}
              onChange={(e) => setForm({ ...form, expectedOutput: e.target.value })}
              fullWidth
              multiline
              minRows={2}
            />
          </Box>
        )}
      </DialogContent>

      {tab === 1 && (
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateAndAssign}
            disabled={submitting || !form.title.trim() || !form.description.trim()}
          >
            {submitting ? "Assigning..." : "Create & Assign"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

export default ChangeQuestionDialog;
