import { useCallback, useState, useEffect, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { Box } from "@mui/material";
import { pythonLanguage } from "@codemirror/lang-python";
import { javascriptLanguage } from "@codemirror/lang-javascript";
import { cppLanguage } from "@codemirror/lang-cpp";
import { javaLanguage } from "@codemirror/lang-java";
import { LanguageSupport } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { xcodeLight, xcodeDark } from "@uiw/codemirror-theme-xcode";
import { githubLight, githubDark } from "@uiw/codemirror-theme-github";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { aura } from "@uiw/codemirror-theme-aura";
import { tokyoNight } from "@uiw/codemirror-theme-tokyo-night";
import { tokyoNightStorm } from "@uiw/codemirror-theme-tokyo-night-storm";
import { tokyoNightDay } from "@uiw/codemirror-theme-tokyo-night-day";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { socket } from "../../socket";
import ACTIONS from "../../utils/Actions";
import { useDispatch, useSelector } from "react-redux";
import useInterviewPermissions from "../../hooks/useInterviewPermissions";
import { PERMISSIONS } from "../../utils/permissions";
import { getEditorValue } from "../../utils/codeHelpers";

const languageExtensions = {
  javascript: [new LanguageSupport(javascriptLanguage)],
  python: [new LanguageSupport(pythonLanguage)],
  cpp: [new LanguageSupport(cppLanguage)],
  java: [new LanguageSupport(javaLanguage)],
};

const themeExtensions = {
  xcodeLight,
  xcodeDark,
  githubDark,
  githubLight,
  dracula,
  aura,
  tokyoNight,
  tokyoNightStorm,
  tokyoNightDay,
  vscodeDark,
};

const scrollableEditorTheme = EditorView.theme({
  "&": {
    height: "100%",
    maxHeight: "100%",
  },
  ".cm-scroller": {
    overflow: "auto",
    overscrollBehavior: "contain",
  },
});

export default function Editor({ spaceId, fillContainer = false }) {
  const dispatch = useDispatch();
  const state = useSelector((state) => state.spaceReducer);
  const { can, isInterview, isInterviewer } = useInterviewPermissions();
  const interview = useSelector((state) => state.spaceReducer.interview);
  const [codeChange, setCodeChange] = useState(null);
  const [editorHeight, setEditorHeight] = useState(300);
  const containerRef = useRef(null);
  const editorMountRef = useRef(null);

  const canWriteCode = can(PERMISSIONS.WRITE_CODE);
  const isReadOnly = isInterview && !canWriteCode;
  const showReadOnlyHint =
    isReadOnly && isInterviewer && interview?.candidate?.name;

  useEffect(() => {
    const target = fillContainer ? editorMountRef.current : containerRef.current;
    if (!target) return undefined;

    const updateHeight = () => {
      if (target) {
        setEditorHeight(Math.max(target.clientHeight, 160));
      }
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(target);

    return () => observer.disconnect();
  }, [fillContainer, showReadOnlyHint]);

  const onChange = useCallback(
    (value, viewUpdate) => {
      if (isReadOnly) return;

      setCodeChange(viewUpdate.state.toJSON().doc);
      socket.emit(ACTIONS.CODE_CHANGE, {
        spaceId,
        change: viewUpdate.state.toJSON().doc,
      });
    },
    [spaceId, isReadOnly]
  );

  useEffect(() => {
    if (codeChange === null) return;

    dispatch({
      type: "updateCurrentData",
      payload: { ...state.currentData, fileData: codeChange },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeChange]);

  const codeMirrorHeight = fillContainer
    ? `${editorHeight}px`
    : "calc(100vh - 220px)";

  return (
    <Box
      ref={containerRef}
      className="code-editor-root"
      sx={{
        height: fillContainer ? "100%" : "auto",
        display: "flex",
        flexDirection: "column",
        flex: fillContainer ? 1 : "none",
        minHeight: fillContainer ? 0 : "auto",
        overflow: "hidden",
      }}
    >
      {showReadOnlyHint && (
        <Box
          sx={{
            px: 1.5,
            py: 0.5,
            mb: 0.5,
            borderRadius: 1,
            bgcolor: "warning.dark",
            color: "warning.contrastText",
            fontSize: 12,
            flexShrink: 0,
          }}
        >
          Read-only mode: Interviewers cannot edit code while a candidate is in
          the room.
        </Box>
      )}
      <Box
        ref={editorMountRef}
        sx={{
          flex: 1,
          minHeight: 0,
          height: fillContainer ? "100%" : editorHeight,
          overflow: "hidden",
        }}
      >
        <CodeMirror
          value={getEditorValue(state.currentData?.fileData)}
          autoFocus={!isReadOnly}
          readOnly={isReadOnly}
          editable={!isReadOnly}
          height={codeMirrorHeight}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
          }}
          theme={themeExtensions[state.theme]}
          extensions={[
            scrollableEditorTheme,
            ...languageExtensions[state.language],
          ]}
          onChange={onChange}
          style={{
            fontSize: state.fontSize,
            height: codeMirrorHeight,
            maxHeight: codeMirrorHeight,
          }}
        />
      </Box>
    </Box>
  );
}
