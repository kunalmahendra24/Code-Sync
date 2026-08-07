import React from "react";
import { Box, Button, CircularProgress } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

function CodeActionBar({ loading, onRun }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 1,
        p: 1,
        pt: 0.5,
        pb: 0.5,
        backgroundColor: "background.paper",
        borderRadius: "8px 8px 0 0",
      }}
    >
      <Button
        variant="contained"
        size="small"
        startIcon={
          loading ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <PlayArrowIcon />
          )
        }
        onClick={onRun}
        disabled={loading}
      >
        Run Code
      </Button>
    </Box>
  );
}

export default CodeActionBar;
