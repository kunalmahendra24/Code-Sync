const ROLES = {
  INTERVIEWER: "interviewer",
  CANDIDATE: "candidate",
  OBSERVER: "observer",
};

const PERMISSIONS = {
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

const ROLE_PERMISSIONS = {
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

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : null;

const normalizeId = (id) => (id ? id.toString() : null);

const matchesInterviewer = (interview, participant = {}) => {
  if (!interview?.interviewer) return false;

  const interviewerUserId = normalizeId(interview.interviewer.userId);
  const participantUserId = normalizeId(participant.userId);
  if (interviewerUserId && participantUserId && interviewerUserId === participantUserId) {
    return true;
  }

  const participantEmail = normalizeEmail(participant.email);
  const interviewerEmail = normalizeEmail(interview.interviewer.email);
  if (participantEmail && interviewerEmail && participantEmail === interviewerEmail) {
    return true;
  }

  const participantName = participant.name?.trim();
  const interviewerName = interview.interviewer.name?.trim();
  if (participantName && interviewerName && participantName === interviewerName) {
    return true;
  }

  return false;
};

const matchesCandidate = (interview, participant = {}) => {
  if (!interview?.candidate?.name && !interview?.candidate?.email) return false;

  const candidateUserId = normalizeId(interview.candidate.userId);
  const participantUserId = normalizeId(participant.userId);
  if (candidateUserId && participantUserId && candidateUserId === participantUserId) {
    return true;
  }

  const participantEmail = normalizeEmail(participant.email);
  const candidateEmail = normalizeEmail(interview.candidate.email);
  if (participantEmail && candidateEmail && participantEmail === candidateEmail) {
    return true;
  }

  const participantName = participant.name?.trim().toLowerCase();
  const candidateName = interview.candidate.name?.trim().toLowerCase();
  if (participantName && candidateName && participantName === candidateName) {
    return true;
  }

  return false;
};

const isInterviewerParticipant = (interview, participant = {}) =>
  matchesInterviewer(interview, participant);

const resolveParticipantRole = (interview, participant = {}) => {
  if (!interview) return null;
  if (!participant?.name && !participant?.email && !participant?.userId) return null;

  if (matchesInterviewer(interview, participant)) {
    return ROLES.INTERVIEWER;
  }

  if (matchesCandidate(interview, participant)) {
    return ROLES.CANDIDATE;
  }

  if (!interview.candidate?.name) {
    return ROLES.CANDIDATE;
  }

  return ROLES.OBSERVER;
};

const canExecuteCode = (interview, participant = {}) => {
  if (!interview) return true;
  if (matchesInterviewer(interview, participant)) return true;
  if (matchesCandidate(interview, participant)) return true;

  if (!interview.candidate?.name && participant?.name) {
    return !matchesInterviewer(interview, participant);
  }

  return false;
};

const canWriteCode = (interview, role) => {
  if (!interview) return true;
  if (role === ROLES.CANDIDATE) return true;
  if (role === ROLES.INTERVIEWER && !interview.candidate?.name) return true;
  return false;
};

const getPermissionsForRole = (role) => ROLE_PERMISSIONS[role] || [];

const hasPermission = (role, permission) =>
  getPermissionsForRole(role).includes(permission);

const buildInterviewContext = (interview, participant) => {
  const role = resolveParticipantRole(interview, participant);
  const permissions = getPermissionsForRole(role);

  if (canWriteCode(interview, role) && !permissions.includes(PERMISSIONS.WRITE_CODE)) {
    permissions.push(PERMISSIONS.WRITE_CODE);
  }

  return {
    role,
    permissions,
  };
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  resolveParticipantRole,
  getPermissionsForRole,
  hasPermission,
  buildInterviewContext,
  canWriteCode,
  canExecuteCode,
  matchesInterviewer,
  matchesCandidate,
};
