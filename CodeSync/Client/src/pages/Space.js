import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
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
import useAuth from "../hooks/useAuth";
import { socket } from "../socket";
import ACTIONS from "../utils/Actions";
import { useDispatch, useSelector } from "react-redux";
import useLocalStorage from "../hooks/useLocalStorage";
import {
  getSpaceSession,
  saveSpaceSession,
} from "../utils/spaceSession";

function Space() {
  const { auth } = useAuth();
  const [loadError, setLoadError] = useState(false);
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
        }
      : null;
    const participant = fromState || getSpaceSession(spaceId);

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

    return () => {
      socket.off(ACTIONS.JOINED, onJoined);
      socket.off(ACTIONS.SYNC_CODE, onSyncCode);
      socket.off(ACTIONS.SYNC_FILE_METADATA, onSyncFileMetadata);
      socket.off(ACTIONS.LEFT, onLeft);
    };
  }, [spaceId, location.state, dispatch]);

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
          title: "Cannot connect to server at the moment!",
          data: "Try again later",
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

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          backgroundColor: "background.default",
        }}
      >
        <Box sx={{ flex: "0 0 auto", p: 1 }}>
          <SpaceHeader loggedInUser={auth} spaceId={spaceId} />
        </Box>
        <Box sx={{ flex: "1 1 auto", p: 1 }}>
          <CodeArea spaceId={spaceId} />
        </Box>
      </Box>
    </>
  );
}

export default Space;
