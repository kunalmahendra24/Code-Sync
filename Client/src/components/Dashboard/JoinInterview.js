import { Box, Button, IconButton, Typography, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import React, { useEffect, useState } from "react";
import axiosConfig from "../../utils/axiosConfig";
import { saveSpaceSession } from "../../utils/spaceSession";

export default function JoinInterview({
  roomId,
  dispatch,
  loggedInUser,
  showJoinInterviewBackdrop,
  setMessage,
  setError,
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [guestName, setGuestName] = useState("");

  useEffect(() => {
    if (showJoinInterviewBackdrop) {
      dispatch({ type: "updateRoomId", payload: "" });
      setGuestName("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showJoinInterviewBackdrop]);

  const handleJoin = async () => {
    if (!roomId?.trim()) return;

    const name = loggedInUser?.user?.name || guestName?.trim();
    if (!name) {
      setMessage?.({ title: "Error!", data: "Please enter your name" });
      setError?.(true);
      return;
    }

    setLoading(true);
    try {
      const joinRes = await axiosConfig.put(`/interviews/${roomId.trim()}/join`, {
        name,
        email: loggedInUser?.user?.email || null,
      });

      if (joinRes.status === 200) {
        const participant = {
          name,
          email: loggedInUser?.user?.email || null,
        };
        saveSpaceSession(roomId.trim(), participant);
        navigate(`/space/${roomId.trim()}`, {
          state: { ...participant, isInterview: true },
        });
        dispatch({ type: "handleJoinInterviewBackdrop", payload: false });
      }
    } catch (err) {
      setMessage?.({
        title: "Error!",
        data: err?.response?.data?.error || "Invalid interview room ID",
      });
      setError?.(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: "30vw",
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
          Join Interview
        </Typography>

        <IconButton
          sx={{ color: "primary.main", mb: 4 }}
          onClick={() =>
            dispatch({ type: "handleJoinInterviewBackdrop", payload: false })
          }
        >
          <CloseIcon sx={{ color: "error.main" }} />
        </IconButton>
      </Box>

      <TextField
        name="roomId"
        placeholder="Paste Interview Room ID"
        sx={{ width: "100%", mb: 2 }}
        value={roomId}
        onChange={(e) =>
          dispatch({ type: "updateRoomId", payload: e.target.value })
        }
      />

      {!loggedInUser && (
        <TextField
          name="guestName"
          placeholder="Enter your name"
          sx={{ width: "100%", mb: 2 }}
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
        />
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
        <Button
          variant="contained"
          sx={{ height: "43px", mr: 2 }}
          onClick={handleJoin}
          disabled={loading || !roomId?.trim()}
        >
          {loading ? "Joining..." : "Join as Candidate"}
        </Button>
      </Box>
    </Box>
  );
}
