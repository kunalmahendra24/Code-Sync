import { useEffect } from "react";
import { Box, Button, IconButton, Typography, TextField } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import React from "react";
import axiosConfig from "../../utils/axiosConfig";
import { copySpaceId } from "../../utils/copySpaceId";
import CloseIcon from "@mui/icons-material/Close";
import { v4 as uuidv4 } from "uuid";

export default function CreateInterview({
  roomId,
  interviewTitle,
  dispatch,
  setError,
  setMessage,
  setSuccess,
  showCreateInterviewBackdrop,
}) {
  useEffect(() => {
    if (showCreateInterviewBackdrop) {
      dispatch({ type: "updateRoomId", payload: uuidv4() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCreateInterviewBackdrop]);

  const handleCreate = async () => {
    if (!interviewTitle?.trim()) {
      setError(true);
      setMessage({ title: ":(", data: "Title cannot be empty" });
      return;
    }

    if (!roomId) {
      setError(true);
      setMessage({
        title: "Error!",
        data: "Room ID is missing. Close and try again.",
      });
      return;
    }

    try {
      const res = await axiosConfig.post("/interviews", {
        roomId,
        title: interviewTitle.trim(),
      });
      if (res.status === 201) {
        dispatch({ type: "updateListInterviews", payload: res.data.interviews });
        dispatch({
          type: "updateOriginalInterviews",
          payload: res.data.interviews,
        });
        dispatch({ type: "handleCreateInterviewBackdrop", payload: false });
        dispatch({ type: "updateInterviewTitle", payload: "" });
        setSuccess(true);
        setMessage({
          title: "Created!",
          data: `Interview "${interviewTitle.trim()}" is ready`,
        });
      }
    } catch (err) {
      const status = err?.response?.status;
      const data =
        err?.response?.data?.error ||
        (status === 401
          ? "Session expired. Please log in again."
          : "Could not create interview. Try again.");
      setError(true);
      setMessage({ title: "Error!", data });
    }
  };

  const handleCopy = () => {
    const { status, message } = copySpaceId(roomId);
    setSuccess(status);
    setMessage(message);
  };

  return (
    <Box
      sx={{
        minWidth: "30vw",
        backgroundColor: "background.paper",
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        p: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h2"
          sx={{
            color: "text.primary",
            fontSize: 30,
            fontWeight: 700,
            pb: 4,
          }}
        >
          Create Interview Room
        </Typography>

        <IconButton
          sx={{ color: "primary.main", mb: 4 }}
          onClick={() =>
            dispatch({ type: "handleCreateInterviewBackdrop", payload: false })
          }
        >
          <CloseIcon sx={{ color: "error.main" }} />
        </IconButton>
      </Box>

      <TextField
        disabled
        name="roomId"
        label="Interview Room ID"
        sx={{ width: "100%", mb: 1 }}
        value={roomId}
      />

      <TextField
        autoFocus
        name="title"
        placeholder="Enter interview title"
        sx={{ width: "100%", mb: 2 }}
        value={interviewTitle}
        onChange={(e) =>
          dispatch({ type: "updateInterviewTitle", payload: e.target.value })
        }
      />

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button
          variant="contained"
          sx={{ height: "43px", mr: 2 }}
          onClick={handleCreate}
        >
          Create Interview
        </Button>

        <Button
          variant="outlined"
          sx={{ height: "43px" }}
          onClick={handleCopy}
          startIcon={<ContentCopyIcon />}
        >
          Copy Room ID
        </Button>
      </Box>
    </Box>
  );
}
