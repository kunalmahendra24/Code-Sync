const INITIAL_STATE = {
  spaceData: [],
  currentData: null,
  loadingScreen: true,
  spaceName: "",
  activeUsers: [],
  successSnackbar: false,
  failSnackbar: false,
  message: { title: "", data: "" },
  language: "javascript",
  theme: "aura",
  fontSize: 15,
  interview: null,
  userRole: null,
  permissions: [],
  executionResult: null,
};

function spaceReducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case "updateSpaceData":
      return { ...state, spaceData: action.payload };
    case "updateCurrentData":
      return { ...state, currentData: action.payload };
    case "removeLoadingScreen":
      return { ...state, loadingScreen: false };
    case "updateSpaceName":
      return { ...state, spaceName: action.payload };
    case "updateSuccess":
      return { ...state, successSnackbar: action.payload };
    case "updateFail":
      return { ...state, failSnackbar: action.payload };
    case "updateMessage":
      return { ...state, message: action.payload };
    case "updateActiveUsers":
      return { ...state, activeUsers: action.payload };
    case "updateLanguage":
      return { ...state, language: action.payload };
    case "updateTheme":
      return { ...state, theme: action.payload };
    case "updateFontSize":
      return { ...state, fontSize: action.payload };
    case "updateFileMetadata":
      return {
        ...state,
        currentData: {
          ...state.currentData,
          fileLang: action.payload.fileLang,
          fileName: action.payload.fileName,
        },
        language: action.payload.fileLang,
      };
    case "updateInterview": {
      if (!action.payload) {
        return { ...state, interview: null };
      }

      const { role, permissions, ...interviewData } = action.payload;

      return {
        ...state,
        interview: interviewData,
      };
    }
    case "updateUserRole":
      return { ...state, userRole: action.payload };
    case "updatePermissions":
      return { ...state, permissions: action.payload };
    case "updateInterviewQuestion":
      return {
        ...state,
        interview: state.interview
          ? { ...state.interview, question: action.payload }
          : state.interview,
      };
    case "updateInterviewTimer":
      return {
        ...state,
        interview: state.interview
          ? { ...state.interview, timer: action.payload }
          : state.interview,
      };
    case "updateExecutionResult":
      return { ...state, executionResult: action.payload };
    case "appendInterviewExecution": {
      if (!state.interview || !action.payload?.executionRecord) {
        return state;
      }

      const record = action.payload.executionRecord;
      const history = state.interview.executionHistory || [];
      const recordTime = new Date(record.executedAt).getTime();
      const alreadyLogged = history.some((item) => {
        const itemTime = new Date(item.executedAt).getTime();
        return (
          itemTime === recordTime &&
          item.executedBy?.name === record.executedBy?.name &&
          item.output === record.output
        );
      });

      if (alreadyLogged) {
        return state;
      }

      return {
        ...state,
        interview: {
          ...state.interview,
          executionHistory: [...history, record],
        },
      };
    }
    case "resetSpaceState":
      return INITIAL_STATE;
    default:
      return state;
  }
}

export default spaceReducer;
