import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import CodeSettings from "./CodeSettings";
import CodeActionBar from "./CodeActionBar";
import Editor from "./Editor";
import ExecutionConsole from "./ExecutionConsole";
import useInterviewPermissions from "../../hooks/useInterviewPermissions";
import useAuth from "../../hooks/useAuth";
import axiosConfig from "../../utils/axiosConfig";
import { extractCodeString } from "../../utils/codeHelpers";
import { resolveSpaceParticipant, buildExecutedBy, canRunCodeInInterview } from "../../utils/interviewHelpers";

export default function CodeArea({ spaceId }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { auth } = useAuth();
  const state = useSelector((store) => store.spaceReducer);
  const participant = resolveSpaceParticipant(spaceId, location.state, auth);
  const { isInterview, userRole } = useInterviewPermissions(participant);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [stdin, setStdin] = useState("");

  const getExecutedBy = () => buildExecutedBy(participant, auth);

  const showRun =
    !isInterview ||
    canRunCodeInInterview(state.interview, participant, auth, userRole);
  const showConsole = isInterview || showRun;

  useEffect(() => {
    if (state.interview?.question?.expectedInput) {
      setStdin(state.interview.question.expectedInput);
    }
  }, [state.interview?.question?.expectedInput]);

  useEffect(() => {
    if (!state.executionResult) return;

    setResult(state.executionResult);
    if (state.executionResult.stdin !== undefined) {
      setStdin(state.executionResult.stdin);
    }
    setLoading(false);
  }, [state.executionResult]);

  const handleRun = async () => {
    const code = extractCodeString(state.currentData?.fileData);
    const language = state.language;

    setLoading(true);
    setResult(null);

    try {
      const res = await axiosConfig.post("/execute", {
        spaceId,
        language,
        code,
        stdin,
        action: "run",
        executedBy: getExecutedBy(),
      });

      setResult(res.data);
      dispatch({ type: "updateExecutionResult", payload: res.data });
    } catch (e) {
      const errorResult = {
        success: false,
        output: "",
        compilationError: "",
        runtimeError: e?.response?.data?.error || "Execution failed",
        executionTimeMs: 0,
        memoryUsedKb: null,
        stdin,
        executedBy: getExecutedBy(),
      };
      setResult(errorResult);
      dispatch({ type: "updateExecutionResult", payload: errorResult });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        height: isInterview ? "100%" : "calc(100vh - 80px)",
        minHeight: 0,
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {showConsole && showRun && (
        <Box sx={{ flex: "0 0 auto" }}>
          <CodeActionBar loading={loading} onRun={handleRun} />
        </Box>
      )}

      <Box
        sx={{
          flex: isInterview ? "0 1 48%" : "1 1 auto",
          minHeight: isInterview ? 140 : 0,
          maxHeight: isInterview ? "48%" : "none",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Editor spaceId={spaceId} fillContainer={isInterview} />
      </Box>

      {showConsole && (
        <Box
          sx={{
            flex: isInterview ? "1 1 52%" : "0 0 auto",
            minHeight: isInterview ? 260 : 0,
            mt: isInterview ? 0.5 : 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <ExecutionConsole
            result={result}
            loading={loading}
            stdin={stdin}
            onStdinChange={setStdin}
            expanded={isInterview}
            watchMode={isInterview}
            readOnlyInput={false}
          />
        </Box>
      )}

      <Box sx={{ flex: "0 0 auto" }}>
        <CodeSettings />
      </Box>
    </Box>
  );
}
