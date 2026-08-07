import React from "react";
import {
  Box,
  Typography,
  Button,
  Backdrop,
  OutlinedInput,
  InputAdornment,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import ListInterviews from "./ListInterviews";
import CreateInterview from "./CreateInterview";
import JoinInterview from "./JoinInterview";

function UserInterviews({
  setMessage,
  setSuccess,
  setError,
  loggedInUser,
  listInterviews,
  originalInterviews,
  dispatch,
  showCreateInterviewBackdrop,
  showJoinInterviewBackdrop,
  roomId,
  interviewTitle,
}) {
  function searchQuery(searchTerm) {
    if (searchTerm !== "") {
      const filtered = originalInterviews.filter((interview) => {
        return (
          interview.roomId.includes(searchTerm) ||
          interview.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      dispatch({ type: "updateListInterviews", payload: filtered });
    } else {
      dispatch({ type: "updateListInterviews", payload: originalInterviews });
    }
  }

  return (
    <>
      <Backdrop
        sx={{
          zIndex: 5,
          backdropFilter: "blur(5px)",
        }}
        open={showCreateInterviewBackdrop}
      >
        <CreateInterview
          roomId={roomId}
          interviewTitle={interviewTitle}
          setError={setError}
          setSuccess={setSuccess}
          setMessage={setMessage}
          dispatch={dispatch}
          showCreateInterviewBackdrop={showCreateInterviewBackdrop}
        />
      </Backdrop>

      <Backdrop
        sx={{ zIndex: 5, backdropFilter: "blur(5px)" }}
        open={showJoinInterviewBackdrop}
      >
        <JoinInterview
          roomId={roomId}
          loggedInUser={loggedInUser}
          dispatch={dispatch}
          showJoinInterviewBackdrop={showJoinInterviewBackdrop}
          setMessage={setMessage}
          setError={setError}
        />
      </Backdrop>

      <Box sx={{ display: "flex", justifyContent: "center", flexDirection: "column" }}>
        <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
          <Box
            sx={{
              p: 1,
              pt: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "background.paper",
            }}
          >
            <Typography
              sx={{
                fontSize: 40,
                fontWeight: 700,
                pr: 5,
                color: "text.primary",
              }}
            >
              Interview Rooms
            </Typography>

            <OutlinedInput
              disabled={!listInterviews}
              size="small"
              sx={{ minWidth: "30%" }}
              onChange={(e) => searchQuery(e.target.value)}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton edge="end">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              }
            />

            <Box>
              <Button
                variant="outlined"
                startIcon={<RocketLaunchIcon />}
                sx={{ mr: 2 }}
                onClick={() =>
                  dispatch({ type: "handleJoinInterviewBackdrop", payload: true })
                }
              >
                Join Interview
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() =>
                  dispatch({ type: "handleCreateInterviewBackdrop", payload: true })
                }
              >
                Create Interview
              </Button>
            </Box>
          </Box>

          <Box sx={{ flex: 1, mb: "20vh", overflowY: "scroll", p: 2 }}>
            <ListInterviews
              setMessage={setMessage}
              setSuccess={setSuccess}
              setError={setError}
              loggedInUser={loggedInUser}
              listInterviews={listInterviews}
              dispatch={dispatch}
            />
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default UserInterviews;
