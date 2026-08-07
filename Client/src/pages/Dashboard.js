import React, { useState, useEffect, useReducer, useContext } from "react";
import {
  Box,
  Button,
  Tabs,
  Tab,
  Alert,
  AlertTitle,
  Snackbar,
  IconButton,
  Divider,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import UserSpaces from "../components/Dashboard/UserSpaces";
import UserInterviews from "../components/Dashboard/UserInterviews";
import UserSettings from "../components/Dashboard/UserSettings";
import Profile from "../components/Dashboard/Profile";
import { useAxios } from "../hooks/useAxios";
import useAuth from "../hooks/useAuth";
import axiosConfig from "../utils/axiosConfig";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { ColorModeContext } from "../context/ColorModeContext";
import { useTheme } from "@mui/material/styles";

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const initialState = {
  value: 0,
  listSpace: undefined,
  originalSpace: null,
  spaceId: "",
  spaceName: "",
  showCreateSpaceBackdrop: false,
  showJoinSpaceBackdrop: false,
  listInterviews: undefined,
  originalInterviews: null,
  roomId: "",
  interviewTitle: "",
  showCreateInterviewBackdrop: false,
  showJoinInterviewBackdrop: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "updateValue":
      return { ...state, value: action.payload };
    case "updateListSpaces":
      return { ...state, listSpaces: action.payload };
    case "updateOriginalSpaces":
      return { ...state, originalSpace: action.payload };
    case "updateSpaceId":
      return { ...state, spaceId: action.payload };
    case "updateSpaceName":
      return { ...state, spaceName: action.payload };
    case "handleCreateBackdrop":
      return { ...state, showCreateSpaceBackdrop: action.payload };
    case "handleJoinBackdrop":
      return { ...state, showJoinSpaceBackdrop: action.payload };
    case "updateListInterviews":
      return { ...state, listInterviews: action.payload };
    case "updateOriginalInterviews":
      return { ...state, originalInterviews: action.payload };
    case "updateRoomId":
      return { ...state, roomId: action.payload };
    case "updateInterviewTitle":
      return { ...state, interviewTitle: action.payload };
    case "handleCreateInterviewBackdrop":
      return { ...state, showCreateInterviewBackdrop: action.payload };
    case "handleJoinInterviewBackdrop":
      return { ...state, showJoinInterviewBackdrop: action.payload };
    default:
      throw new Error();
  }
}

function Dashboard() {
  const { auth, setAuth } = useAuth();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState({ title: "", data: "" });
  const colorMode = useContext(ColorModeContext);
  const theme = useTheme();
  const { response, error: responseError } = useAxios({
    method: "GET",
    url: "/spaces",
  });

  const { response: interviewsResponse, error: interviewsError } = useAxios({
    method: "GET",
    url: "/interviews",
  });

  useEffect(() => {
    document.title = "Dashboard";
  }, []);

  useEffect(() => {
    if (responseError !== undefined) {
      setMessage({
        title: "error!",
        data: "Can't get your spaces. Try again later!",
      });
      setError(true);
      return;
    }

    if (response === undefined) return;

    dispatch({ type: "updateListSpaces", payload: response.data });
    dispatch({ type: "updateOriginalSpaces", payload: response.data });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  useEffect(() => {
    if (interviewsError !== undefined) {
      setMessage({
        title: "error!",
        data: "Can't get your interviews. Try again later!",
      });
      setError(true);
      return;
    }

    if (interviewsResponse === undefined) return;

    dispatch({ type: "updateListInterviews", payload: interviewsResponse.data });
    dispatch({
      type: "updateOriginalInterviews",
      payload: interviewsResponse.data,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewsResponse]);

  const handleLogout = async () => {
    try {
      await axiosConfig.post("/users/logout");
    } catch {}
    setAuth(null);
    navigate("/", { replace: true });
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
          <AlertTitle>{message.title}</AlertTitle>
          {message.data}
        </Alert>
      </Snackbar>

      <Snackbar
        open={success}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        autoHideDuration={2500}
      >
        <Alert variant="filled" severity="success" sx={{ width: "100%" }}>
          <AlertTitle>{message.title}</AlertTitle>
          {message.data}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "background.default",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            px: { xs: 2, sm: 3 },
            py: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Box
            component="img"
            sx={{
              height: 56,
              width: 64,
              flexShrink: 0,
            }}
            alt="CodeSync logo"
            src="/logo1.png"
          />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, sm: 2 },
              flexWrap: "wrap",
              justifyContent: { xs: "flex-start", sm: "flex-end" },
              flex: 1,
              minWidth: 0,
            }}
          >
            <Profile loggedInUser={auth} />
            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: "none", sm: "block" }, height: 36, alignSelf: "center" }}
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton onClick={colorMode.toggleColorMode} size="large">
                {theme.palette.mode === "light" ? (
                  <DarkModeIcon />
                ) : (
                  <LightModeIcon />
                )}
              </IconButton>
              <Button
                variant="contained"
                size="medium"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ whiteSpace: "nowrap" }}
              >
                Logout
              </Button>
            </Box>
          </Box>
        </Box>

        <Box sx={{ px: 2, backgroundColor: "background.paper" }}>
          <Tabs
            value={state.value}
            onChange={(event, value) =>
              dispatch({ type: "updateValue", payload: value })
            }
          >
            <Tab
              icon={<WorkspacesIcon />}
              iconPosition="start"
              label="Sessions"
              sx={{ pb: 1, pt: 3 }}
            />
            <Tab
              icon={<VideoCallIcon />}
              iconPosition="start"
              label="Interviews"
              sx={{ pb: 1, pt: 3 }}
            />
            <Tab
              icon={<SettingsIcon />}
              iconPosition="start"
              label="Settings"
              sx={{ pb: 1, pt: 3 }}
            />
          </Tabs>
        </Box>

        <Box sx={{ px: 2, pb: 4 }}>
          <TabPanel value={state.value} index={0}>
            <UserSpaces
              setMessage={setMessage}
              setSuccess={setSuccess}
              setError={setError}
              loggedInUser={auth}
              listSpaces={state.listSpaces}
              dispatch={dispatch}
              originalSpace={state.originalSpace}
              showCreateSpaceBackdrop={state.showCreateSpaceBackdrop}
              showJoinSpaceBackdrop={state.showJoinSpaceBackdrop}
              spaceId={state.spaceId}
              spaceName={state.spaceName}
            />
          </TabPanel>
          <TabPanel value={state.value} index={1}>
            <UserInterviews
              setMessage={setMessage}
              setSuccess={setSuccess}
              setError={setError}
              loggedInUser={auth}
              listInterviews={state.listInterviews}
              originalInterviews={state.originalInterviews}
              dispatch={dispatch}
              showCreateInterviewBackdrop={state.showCreateInterviewBackdrop}
              showJoinInterviewBackdrop={state.showJoinInterviewBackdrop}
              roomId={state.roomId}
              interviewTitle={state.interviewTitle}
            />
          </TabPanel>
          <TabPanel value={state.value} index={2}>
            <UserSettings loggedInUser={auth} setLoggedInUser={setAuth} />
          </TabPanel>
        </Box>
      </Box>
    </>
  );
}

export default Dashboard;
