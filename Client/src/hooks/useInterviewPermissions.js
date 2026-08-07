import { useSelector } from "react-redux";
import useAuth from "./useAuth";
import {
  hasPermission as checkPermission,
  PERMISSIONS,
  getPermissionsForRole,
} from "../utils/permissions";
import {
  canWriteCodeInInterview,
  canRunCodeInInterview,
  isLoggedInInterviewer,
  isJoinedCandidate,
} from "../utils/interviewHelpers";

const useInterviewPermissions = (participant = null) => {
  const { auth } = useAuth();
  const { interview, userRole, permissions } = useSelector(
    (state) => state.spaceReducer
  );

  const isInterview = Boolean(interview);
  const isInterviewer =
    userRole === "interviewer" || isLoggedInInterviewer(interview, auth);
  const isCandidate =
    userRole === "candidate" || isJoinedCandidate(interview, participant, auth);

  const can = (permission) => {
    if (!isInterview) return true;

    if (
      permission === PERMISSIONS.WRITE_CODE &&
      canWriteCodeInInterview(interview, userRole)
    ) {
      return true;
    }

    if (
      (permission === PERMISSIONS.RUN_CODE ||
        permission === PERMISSIONS.EXECUTE_CODE) &&
      canRunCodeInInterview(interview, participant, auth, userRole)
    ) {
      return true;
    }

    if (checkPermission(userRole, permissions, permission)) {
      return true;
    }

    return getPermissionsForRole(userRole).includes(permission);
  };

  return {
    isInterview,
    userRole,
    permissions: permissions || [],
    can,
    isInterviewer,
    isCandidate,
  };
};

export default useInterviewPermissions;
