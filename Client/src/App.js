import { useState, useMemo } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import Home from "./pages/Home";
import Space from "./pages/Space";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import useAuth from "./hooks/useAuth";
import { ColorModeContext } from "./context/ColorModeContext";

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === "light"
      ? {
          background: {
            default: "#ffffff",
            paper: "#fefefa",
          },
          text: {
            primary: "#000000",
            secondary: "rgba(0, 0, 0, 0.65)",
          },
          divider: "rgba(0, 0, 0, 0.12)",
        }
      : {
          background: {
            default: "#000000",
            paper: "#121212",
          },
          text: {
            primary: "#ffffff",
            secondary: "rgba(255, 255, 255, 0.7)",
          },
          divider: "rgba(255, 255, 255, 0.12)",
        }),
  },
});

function App() {
  const { auth } = useAuth();
  const [mode, setMode] = useState("dark");
  const theme = createTheme(getDesignTokens(mode));

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
      },
    }),
    []
  );

  return (
    <>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Routes>
            {auth && <Route path="dashboard" element={<Dashboard />} />}

            {!auth && (
              <>
                <Route path="/" element={<Home />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
              </>
            )}

            <Route path="space/:spaceId" element={<Space />} />

            <Route
              path="*"
              element={<Navigate to={auth ? "/dashboard" : "/"} />}
            />
          </Routes>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </>
  );
}

export default App;
