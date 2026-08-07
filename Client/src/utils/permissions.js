export const ROLES = {
  INTERVIEWER: "interviewer",
  CANDIDATE: "candidate",
  OBSERVER: "observer",
};

export const PERMISSIONS = {
  START_INTERVIEW: "start_interview",
  END_INTERVIEW: "end_interview",
  PAUSE_TIMER: "pause_timer",
  RESUME_TIMER: "resume_timer",
  CHANGE_QUESTION: "change_question",
  VIEW_REPORTS: "view_reports",
  KICK_CANDIDATE: "kick_candidate",
  EXECUTE_CODE: "execute_code",
  WRITE_CODE: "write_code",
  READ_QUESTION: "read_question",
  CHAT: "chat",
  RUN_CODE: "run_code",
};

export const ROLE_PERMISSIONS = {
  [ROLES.INTERVIEWER]: [
    PERMISSIONS.START_INTERVIEW,
    PERMISSIONS.END_INTERVIEW,
    PERMISSIONS.PAUSE_TIMER,
    PERMISSIONS.RESUME_TIMER,
    PERMISSIONS.CHANGE_QUESTION,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.KICK_CANDIDATE,
    PERMISSIONS.RUN_CODE,
    PERMISSIONS.EXECUTE_CODE,
    PERMISSIONS.READ_QUESTION,
  ],
  [ROLES.CANDIDATE]: [
    PERMISSIONS.WRITE_CODE,
    PERMISSIONS.READ_QUESTION,
    PERMISSIONS.CHAT,
    PERMISSIONS.RUN_CODE,
    PERMISSIONS.EXECUTE_CODE,
  ],
  [ROLES.OBSERVER]: [PERMISSIONS.READ_QUESTION],
};

export const getPermissionsForRole = (role) => ROLE_PERMISSIONS[role] || [];

export const hasPermission = (role, permissions, permission) => {
  if (!role) return true;
  return permissions?.includes(permission);
};
