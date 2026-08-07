import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAxios } from "../hooks/useAxios";
import {
  Box,
  Backdrop,
  CircularProgress,
  Typography,
  Snackbar,
  Alert,
  AlertTitle,
} from "@mui/material";
import SpaceHeader from "../components/space/SpaceHeader";
import CodeArea from "../components/space/CodeArea";
import InterviewPanel from "../components/space/InterviewPanel";
import QuestionPanel from "../components/space/QuestionPanel";
import useAuth from "../hooks/useAuth";
import { socket } from "../socket";
import ACTIONS from "../utils/Actions";
import { useDispatch, useSelector } from "react-redux";
import useLocalStorage from "../hooks/useLocalStorage";
import {
  saveSpaceSession,
  clearSpaceSession,
} from "../utils/spaceSession";
import {
  resolveUserRole,
  getPermissionsForRole,
  canWriteCodeInInterview,
  resolveSpaceParticipant,
  canRunCodeInInterview,
} from "../utils/interviewHelpers";
import axiosConfig from "../utils/axiosConfig";

function Space() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [loadError, setLoadError] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState("");
  const [loadingScreen, setLoadingScreen] = useState(true);
  const location = useLocation();
  const dispatch = useDispatch();
  const state = useSelector((state) => state.spaceReducer);
  const spaceId = location.pathname.split("/")[2];

  const [localUser] = useLocalStorage("user", null);
  const [codeChange, setCodeChange] = useState(null);

  const { response, error } = useAxios({
    method: "GET",
    url: `/spaces/${spaceId}`,
  });

  useEffect(() => {
    document.title =
      state.spaceName.length === 0 ? "Loading..." : state.spaceName;
  }, [state.spaceName]);

  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const fromState = location.state?.name
      ? {
          name: location.state.name,
          email: location.state.email ?? null,
          userId: location.state.userId ?? null,
        }
      : null;
    const participant =
      fromState || resolveSpaceParticipant(spaceId, location.state, auth);

    if (!participant?.name) return;

    if (fromState) {
      saveSpaceSession(spaceId, fromState);
    }

    const onJoined = (activeUsers) => {
      dispatch({
        type: "updateActiveUsers",
        payload: activeUsers,
      });
    };

    const onSyncCode = ({ change }) => {
      setCodeChange(change);
    };

    const onSyncFileMetadata = ({ fileLang, fileName }) => {
      dispatch({
        type: "updateFileMetadata",
        payload: { fileLang, fileName },
      });
    };

    const onLeft = ({ activeUsers }) => {
      dispatch({
        type: "updateActiveUsers",
        payload: activeUsers,
      });
    };

    socket.emit(ACTIONS.JOIN, {
      spaceId,
      name: participant.name,
      email: participant.email,
    });

    socket.on(ACTIONS.JOINED, onJoined);
    socket.on(ACTIONS.SYNC_CODE, onSyncCode);
    socket.on(ACTIONS.SYNC_FILE_METADATA, onSyncFileMetadata);
    socket.on(ACTIONS.LEFT, onLeft);

    socket.emit(ACTIONS.INTERVIEW_JOIN, {
      roomId: spaceId,
      name: participant.name,
      email: participant.email,
      userId: participant.userId ?? null,
    });

    const applyInterviewState = (interviewData) => {
      dispatch({ type: "updateInterview", payload: interviewData });

      const role =
        resolveUserRole(interviewData, participant, auth) || interviewData.role;
      let permissions =
        interviewData.permissions || getPermissionsForRole(role);

      if (
        canWriteCodeInInterview(interviewData, role) &&
        !permissions.includes("write_code")
      ) {
        permissions = [...permissions, "write_code"];
      }

      dispatch({ type: "updateUserRole", payload: role });
      dispatch({ type: "updatePermissions", payload: permissions });
    };

    const onInterviewState = (interviewData) => {
      applyInterviewState(interviewData);
    };

    const onInterviewUpdate = (interviewData) => {
      dispatch({ type: "updateInterview", payload: interviewData });
    };

    const onQuestionUpdate = (question) => {
      dispatch({ type: "updateInterviewQuestion", payload: question });
    };

    const onTimerTick = (timer) => {
      dispatch({ type: "updateInterviewTimer", payload: timer });
    };

    const onTimerSync = (timer) => {
      dispatch({ type: "updateInterviewTimer", payload: timer });
    };

    const onExecutionResult = (result) => {
      dispatch({ type: "updateExecutionResult", payload: result });

      if (result?.executionRecord) {
        dispatch({
          type: "appendInterviewExecution",
          payload: { executionRecord: result.executionRecord },
        });
      }
    };

    const onInterviewKicked = ({ message }) => {
      setPermissionMessage(message);
      setPermissionError(true);
      clearSpaceSession(spaceId);
      setTimeout(() => {
        navigate(auth ? "/dashboard" : "/");
      }, 2000);
    };

    const onInterviewDeleted = ({ message }) => {
      setPermissionMessage(message);
      setPermissionError(true);
      clearSpaceSession(spaceId);
      dispatch({ type: "updateInterview", payload: null });
      dispatch({ type: "updateUserRole", payload: null });
      dispatch({ type: "updatePermissions", payload: [] });
      setTimeout(() => {
        navigate(auth ? "/dashboard" : "/");
      }, 2000);
    };

    const onPermissionDenied = ({ message }) => {
      setPermissionMessage(message);
      setPermissionError(true);
    };

    socket.on(ACTIONS.INTERVIEW_STATE, onInterviewState);
    socket.on(ACTIONS.INTERVIEW_UPDATE, onInterviewUpdate);
    socket.on(ACTIONS.INTERVIEW_QUESTION_UPDATE, onQuestionUpdate);
    socket.on(ACTIONS.INTERVIEW_TIMER_TICK, onTimerTick);
    socket.on(ACTIONS.INTERVIEW_TIMER_SYNC, onTimerSync);
    socket.on(ACTIONS.CODE_EXECUTION_RESULT, onExecutionResult);
    socket.on(ACTIONS.INTERVIEW_KICKED, onInterviewKicked);
    socket.on(ACTIONS.INTERVIEW_DELETED, onInterviewDeleted);
    socket.on(ACTIONS.INTERVIEW_PERMISSION_DENIED, onPermissionDenied);

    return () => {
      socket.off(ACTIONS.JOINED, onJoined);
      socket.off(ACTIONS.SYNC_CODE, onSyncCode);
      socket.off(ACTIONS.SYNC_FILE_METADATA, onSyncFileMetadata);
      socket.off(ACTIONS.LEFT, onLeft);
      socket.off(ACTIONS.INTERVIEW_STATE, onInterviewState);
      socket.off(ACTIONS.INTERVIEW_UPDATE, onInterviewUpdate);
      socket.off(ACTIONS.INTERVIEW_QUESTION_UPDATE, onQuestionUpdate);
      socket.off(ACTIONS.INTERVIEW_TIMER_TICK, onTimerTick);
      socket.off(ACTIONS.INTERVIEW_TIMER_SYNC, onTimerSync);
      socket.off(ACTIONS.CODE_EXECUTION_RESULT, onExecutionResult);
      socket.off(ACTIONS.INTERVIEW_KICKED, onInterviewKicked);
      socket.off(ACTIONS.INTERVIEW_DELETED, onInterviewDeleted);
      socket.off(ACTIONS.INTERVIEW_PERMISSION_DENIED, onPermissionDenied);
    };
  }, [spaceId, location.state, dispatch, auth, navigate]);

  useEffect(() => {
    if (codeChange === null) return;

    dispatch({
      type: "updateCurrentData",
      payload: { ...state.currentData, fileData: codeChange },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeChange]);

  useEffect(() => {
    dispatch({
      type: "updateTheme",
      payload: localUser ? localUser.user.theme : state.theme,
    });
    if (error !== undefined) {
      dispatch({
        type: "updateMessage",
        payload: {
          title: "Could not load this space",
          data:
            error?.response?.data?.error ||
            "Space not found or server unavailable. Check the room ID and try again.",
        },
      });
      setLoadError(true);
      return;
    }

    if (response === undefined) return;

    dispatch({ type: "updateSpaceName", payload: response.data.spaceName });
    dispatch({ type: "updateSpaceData", payload: response.data.spaceData });
    dispatch({ type: "updateActiveUsers", payload: response.data.activeUsers });

    dispatch({
      type: "updateCurrentData",
      payload: response.data.spaceData[0],
    });
    dispatch({
      type: "updateLanguage",
      payload: response.data.spaceData[0].fileLang,
    });
    setLoadingScreen(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response, error]);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const participant = resolveSpaceParticipant(
          spaceId,
          location.state,
          auth
        );

        const params = new URLSearchParams();
        if (participant?.name) params.append("name", participant.name);
        if (participant?.email) params.append("email", participant.email);

        const res = await axiosConfig.get(
          `/interviews/${spaceId}?${params.toString()}`
        );

        let role = res.data.role;
        let permissions = res.data.permissions;

        if (!canRunCodeInInterview(res.data, participant, auth, role)) {
          role = resolveUserRole(res.data, participant, auth);
          permissions = getPermissionsForRole(role);
        }

        dispatch({ type: "updateInterview", payload: res.data });
        dispatch({ type: "updateUserRole", payload: role });
        dispatch({
          type: "updatePermissions",
          payload: permissions || getPermissionsForRole(role),
        });
      } catch {
        dispatch({ type: "updateInterview", payload: null });
        dispatch({ type: "updateUserRole", payload: null });
        dispatch({ type: "updatePermissions", payload: [] });
      }
    };

    fetchInterview();
  }, [spaceId, location.state, dispatch, auth]);

  useEffect(() => {
    if (state.currentData) {
      const ind = state.spaceData.findIndex(
        (item) => item._id === state.currentData._id
      );
      const newSpaceData = state.spaceData;
      newSpaceData[ind] = state.currentData;

      dispatch({ type: "updateSpaceData", payload: newSpaceData });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentData]);

  return (
    <>
      <Backdrop
        sx={{
          backgroundColor: "background.default",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
        }}
        open={loadingScreen}
      >
        <CircularProgress size={100} />
        <Typography
          variant="h1"
          sx={{ color: "text.primary", fontSize: 35, fontWeight: 700, mt: 5 }}
        >
          Loading Space...
        </Typography>
      </Backdrop>

      <Snackbar
        open={loadError}
        onClose={() => setLoadError(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        autoHideDuration={3000}
      >
        <Alert variant="filled" severity="error" sx={{ width: "100%" }}>
          <AlertTitle>{state.message.title}</AlertTitle>
          {state.message.data}
        </Alert>
      </Snackbar>

      <Snackbar
        open={permissionError}
        onClose={() => setPermissionError(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={3000}
      >
        <Alert variant="filled" severity="warning" sx={{ width: "100%" }}>
          <AlertTitle>Access Denied</AlertTitle>
          {permissionMessage}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          backgroundColor: "background.default",
        }}
      >
        <Box sx={{ flex: "0 0 auto", px: 0.5, pt: 0.5 }}>
          <SpaceHeader loggedInUser={auth} spaceId={spaceId} compact={Boolean(state.interview)} />
        </Box>
        {state.interview && (
          <Box sx={{ flex: "0 0 auto", px: 0.5 }}>
            <InterviewPanel interview={state.interview} roomId={spaceId} />
          </Box>
        )}
        <Box
          sx={{
            flex: "1 1 auto",
            p: 0.5,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 0.5,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {state.interview && (
            <Box
              sx={{
                width: { xs: "100%", md: "32%" },
                minWidth: { md: 280 },
                height: { xs: "auto", md: "100%" },
                maxHeight: { xs: "35vh", md: "none" },
                minHeight: 0,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <QuestionPanel question={state.interview.question} />
            </Box>
          )}
          <Box sx={{ flex: 1, minWidth: 0, minHeight: 0 }}>
            <CodeArea spaceId={spaceId} />
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default Space;
