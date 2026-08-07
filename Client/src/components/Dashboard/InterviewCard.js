import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  IconButton,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import { copySpaceId } from "../../utils/copySpaceId";
import { clearSpaceSession, saveSpaceSession } from "../../utils/spaceSession";
import { STATUS_COLORS, STATUS_LABELS } from "../../utils/interviewHelpers";
import axiosConfig from "../../utils/axiosConfig";

export default function InterviewCard({
  item,
  loggedInUser,
  setMessage,
  setSuccess,
  setError,
  dispatch,
}) {
  const date = new Date(item.createdAt);
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const goToInterview = () => {
    const participant = {
      name: loggedInUser.user.name,
      email: loggedInUser.user.email,
    };
    saveSpaceSession(item.roomId, participant);
    navigate(`/space/${item.roomId}`, {
      state: {
        ...participant,
        isInterview: true,
      },
    });
  };

  const handleCopy = () => {
    const { status, message } = copySpaceId(item.roomId);
    setSuccess(status);
    setMessage(message);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await axiosConfig.delete(`/interviews/${item.roomId}`);
      dispatch({ type: "updateListInterviews", payload: res.data });
      dispatch({ type: "updateOriginalInterviews", payload: res.data });
      clearSpaceSession(item.roomId);
      setMessage({ title: `Interview - ${item.title} deleted` });
      setSuccess(true);
      setConfirm(false);
    } catch (err) {
      setMessage({
        title: "Cannot delete interview",
        data: err?.response?.data?.error || "Please try again later.",
      });
      setError(true);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card
      sx={{
        mb: 2,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        p: 1,
        boxShadow:
          "0px 2.3px 4.5px rgba(0, 0, 0, 0.07),0px 6.3px 12.5px rgba(0, 0, 0, 0.046),0px 15.1px 30.1px rgba(0, 0, 0, 0.035),0px 50px 100px rgba(0, 0, 0, 0.024)",
        backgroundColor: "background.paper",
        borderRadius: 2,
        minWidth: "70vw",
      }}
    >
      <CardContent>
        <Typography
          variant="h4"
          sx={{
            fontSize: 30,
            fontWeight: 400,
            mb: 1,
            color: "text.primary",
          }}
        >
          {item.title}
        </Typography>

        <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
          Candidate: {item.candidate?.name || "Not joined yet"}
        </Typography>

        <Typography variant="p" sx={{ fontSize: 11, color: "text.primary" }}>
          Created at: {date.toDateString()} {date.toLocaleTimeString()}
        </Typography>
      </CardContent>

      <CardActions sx={{ alignItems: "center", gap: 1 }}>
        <Chip
          label={STATUS_LABELS[item.status] || item.status}
          color={STATUS_COLORS[item.status] || "default"}
          size="small"
        />
        {confirm ? (
          <>
            <Button
              variant="contained"
              color="error"
              sx={{ height: "45px", mr: 1 }}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
            <Button
              variant="outlined"
              sx={{ height: "45px" }}
              onClick={() => setConfirm(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <IconButton sx={{ color: "text.primary" }} onClick={handleCopy}>
              <ContentCopyIcon />
            </IconButton>
            <IconButton
              sx={{ color: "error.main" }}
              onClick={() => setConfirm(true)}
            >
              <DeleteIcon />
            </IconButton>
            <IconButton sx={{ color: "success.main" }} onClick={goToInterview}>
              <RocketLaunchIcon />
            </IconButton>
          </>
        )}
      </CardActions>
    </Card>
  );
}
