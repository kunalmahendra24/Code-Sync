import { getSpaceSession } from "./spaceSession";

export const formatTimer = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export const STATUS_LABELS = {
  waiting: "Waiting",
  in_progress: "In Progress",
  paused: "Paused",
  completed: "Completed",
};

export const STATUS_COLORS = {
  waiting: "warning",
  in_progress: "success",
  paused: "info",
  completed: "default",
};

export {
  ROLES,
  PERMISSIONS,
  getPermissionsForRole,
} from "./permissions";

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : null;

const normalizeId = (id) => (id ? id.toString() : null);

const isInterviewerParticipant = (interview, participant, loggedInUser) => {
  const participantEmail = normalizeEmail(
    participant?.email || loggedInUser?.user?.email
  );
  const interviewerEmail = normalizeEmail(interview.interviewer?.email);

  const participantUserId = normalizeId(
    participant?.userId || loggedInUser?.user?._id || loggedInUser?.user?.id
  );
  const interviewerUserId = normalizeId(interview.interviewer?.userId);

  if (participantUserId && interviewerUserId && participantUserId === interviewerUserId) {
    return true;
  }

  if (participantEmail && interviewerEmail && participantEmail === interviewerEmail) {
    return true;
  }

  const participantName = participant?.name?.trim();
  const interviewerName = interview.interviewer?.name?.trim();
  if (participantName && interviewerName && participantName === interviewerName) {
    return true;
  }

  return false;
};

export const isLoggedInInterviewer = (interview, auth) =>
  Boolean(interview && auth?.user && isInterviewerParticipant(interview, null, auth));

const isCandidateParticipant = (interview, participant, loggedInUser) => {
  if (!interview) return false;

  if (!interview.candidate?.name && !interview.candidate?.email) {
    return Boolean(participant?.name || loggedInUser?.user?.name);
  }

  const participantEmail = normalizeEmail(
    participant?.email || loggedInUser?.user?.email
  );
  const candidateEmail = normalizeEmail(interview.candidate?.email);

  const participantUserId = normalizeId(
    participant?.userId || loggedInUser?.user?._id || loggedInUser?.user?.id
  );
  const candidateUserId = normalizeId(interview.candidate?.userId);

  if (participantUserId && candidateUserId && participantUserId === candidateUserId) {
    return true;
  }

  if (participantEmail && candidateEmail && participantEmail === candidateEmail) {
    return true;
  }

  const participantName = participant?.name?.trim().toLowerCase();
  const candidateName = interview.candidate?.name?.trim().toLowerCase();
  if (participantName && candidateName && participantName === candidateName) {
    return true;
  }

  return false;
};

export const isJoinedCandidate = (interview, participant, auth) =>
  Boolean(interview && isCandidateParticipant(interview, participant, auth));

export const canRunCodeInInterview = (interview, participant, auth, userRole) => {
  if (!interview) return true;
  if (userRole === "interviewer" || userRole === "candidate") return true;
  if (isLoggedInInterviewer(interview, auth)) return true;
  if (isJoinedCandidate(interview, participant, auth)) return true;
  return false;
};

export const buildExecutedBy = (participant, auth) => ({
  name: participant?.name || auth?.user?.name || "Unknown",
  email: participant?.email ?? auth?.user?.email ?? null,
  userId: participant?.userId ?? auth?.user?._id ?? auth?.user?.id ?? null,
});

export const resolveSpaceParticipant = (spaceId, locationState, auth) => {
  if (locationState?.name) {
    return {
      name: locationState.name,
      email: locationState.email ?? null,
      userId: locationState.userId ?? null,
    };
  }

  const session = getSpaceSession(spaceId);
  if (session?.name) {
    return session;
  }

  if (auth?.user) {
    return {
      name: auth.user.name,
      email: auth.user.email,
      userId: auth.user._id || auth.user.id || null,
    };
  }

  return session;
};

export const resolveUserRole = (interview, participant, loggedInUser) => {
  if (!interview) return null;
  if (!participant && !loggedInUser?.user) return null;

  if (isInterviewerParticipant(interview, participant, loggedInUser)) {
    return "interviewer";
  }

  const participantEmail = normalizeEmail(
    participant?.email || loggedInUser?.user?.email
  );
  const candidateEmail = normalizeEmail(interview.candidate?.email);

  if (candidateEmail && participantEmail && participantEmail === candidateEmail) {
    return "candidate";
  }

  const participantName = participant?.name?.trim().toLowerCase();
  const candidateName = interview.candidate?.name?.trim().toLowerCase();
  if (participantName && candidateName && participantName === candidateName) {
    return "candidate";
  }

  if (!interview.candidate?.name) {
    return "candidate";
  }

  return "observer";
};

export const canWriteCodeInInterview = (interview, userRole) => {
  if (!interview) return true;
  if (userRole === "candidate") return true;
  if (userRole === "interviewer" && !interview.candidate?.name) return true;
  return false;
};
