import React, { useContext, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Alert,
  AlertTitle,
  Snackbar,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axiosConfig from "../../utils/axiosConfig";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { copySpaceId } from "../../utils/copySpaceId";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { ColorModeContext } from "../../context/ColorModeContext";
import { useTheme } from "@mui/material/styles";
import ActiveUsers from "./ActiveUsers";
import { socket } from "../../socket";
import ACTIONS from "../../utils/Actions";
import {
  clearSpaceSession,
  getSpaceSession,
} from "../../utils/spaceSession";

function SpaceHeader({ loggedInUser, spaceId }) {
  const navigate = useNavigate();
  const state = useSelector((state) => state.spaceReducer);
  const dispatch = useDispatch();
  const [loadError, setLoadError] = useState(false);
  const [success, setSuccess] = useState(false);
  const colorMode = useContext(ColorModeContext);
  const theme = useTheme();

  const handleSave = async () => {
    try {
      await axiosConfig.put(`/spaces/${spaceId}`, {
        spaceData: state.spaceData,
      });
      setSuccess(true);
      dispatch({
        type: "updateMessage",
        payload: {
          title: "Saved!",
          data: "This space data is now up to date",
        },
      });
    } catch (e) {
      setLoadError(true);
      dispatch({
        type: "updateMessage",
        payload: {
          title: "Cannot save space data at the moment!",
          data: e?.response?.data?.error || "Try again later!",
        },
      });
    }
  };

  const handleCopy = () => {
    const { status, message } = copySpaceId(spaceId);
    setSuccess(status);
    dispatch({
      type: "updateMessage",
      payload: message,
    });
  };

  const handleLeave = () => {
    const participant = getSpaceSession(spaceId);
    if (participant?.name) {
      socket.emit(ACTIONS.LEAVE, {
        spaceId,
        name: participant.name,
        email: participant.email,
      });
    }
    clearSpaceSession(spaceId);
    dispatch({ type: "resetSpaceState" });
    loggedInUser ? navigate("/dashboard") : navigate("/");
  };

  return (
    <>
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
        open={success}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        autoHideDuration={3000}
      >
        <Alert variant="filled" severity="success" sx={{ width: "100%" }}>
          <AlertTitle>{state.message.title}</AlertTitle>
          {state.message.data}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          pl: 1,
          pr: 1,
        }}
      >
        <Box
          component="img"
          sx={{
            height: "60px",
            width: "70px",
          }}
          alt="CodeSync logo"
          src="/logo1.png"
        />

        <ActiveUsers activeUsers={state.activeUsers} />

        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton sx={{ color: "text.primary" }} onClick={handleCopy}>
            <ContentCopyIcon />
          </IconButton>

          {loggedInUser && (
            <IconButton onClick={handleSave} sx={{ color: "text.primary" }}>
              <SaveIcon />
            </IconButton>
          )}
          <Box>
            <IconButton
              onClick={colorMode.toggleColorMode}
              sx={{ color: "text.primary" }}
            >
              {theme.palette.mode === "light" ? (
                <DarkModeIcon />
              ) : (
                <LightModeIcon />
              )}
            </IconButton>

            <Button variant="contained" sx={{ ml: 1 }} onClick={handleLeave}>
              Leave Session
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default SpaceHeader;
