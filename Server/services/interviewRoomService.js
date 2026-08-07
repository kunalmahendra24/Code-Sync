const Space = require("../models/spaceSchema");
const InterviewRoom = require("../models/interviewRoomSchema");
const questionService = require("./questionService");
const {
  buildInterviewContext,
  hasPermission,
  PERMISSIONS,
  resolveParticipantRole,
  canWriteCode,
} = require("../utils/permissions");
const {
  getLiveTimerState,
  applyPauseToTimer,
  applyResumeToTimer,
  applyStartToTimer,
  applyStopToTimer,
} = require("../utils/timerUtils");

const DEFAULT_SPACE_DATA = [
  {
    fileName: "solution",
    fileData: "",
    fileLang: "javascript",
  },
];

const createInterviewRoom = async ({ roomId, title, interviewer }) => {
  const existingSpace = await Space.findOne({ spaceId: roomId });
  if (existingSpace) {
    throw new Error("Room ID already exists");
  }

  const existingInterview = await InterviewRoom.findOne({ roomId });
  if (existingInterview) {
    await ensureSpaceForInterview(existingInterview);
    throw new Error("Room ID already exists");
  }

  const space = new Space({
    spaceId: roomId,
    spaceName: title,
    owner: interviewer.userId,
    spaceData: DEFAULT_SPACE_DATA,
  });

  const interviewRoom = new InterviewRoom({
    roomId,
    spaceId: roomId,
    title,
    interviewer,
  });

  await space.save();

  try {
    await interviewRoom.save();
  } catch (error) {
    await Space.deleteOne({ spaceId: roomId });
    throw error;
  }

  return interviewRoom;
};

const ensureSpaceForInterview = async (interviewRoom) => {
  if (!interviewRoom) return null;

  const spaceId = interviewRoom.roomId || interviewRoom.spaceId;
  let space = await Space.findOne({ spaceId });
  if (space) return space;

  space = new Space({
    spaceId,
    spaceName: interviewRoom.title,
    owner: interviewRoom.interviewer.userId,
    spaceData: DEFAULT_SPACE_DATA,
  });

  await space.save();
  return space;
};

const repairOrphanedInterviewSpaces = async () => {
  const interviews = await InterviewRoom.find({});
  let repaired = 0;

  for (const interview of interviews) {
    const space = await Space.findOne({ spaceId: interview.roomId });
    if (!space) {
      await ensureSpaceForInterview(interview);
      repaired += 1;
    }
  }

  return repaired;
};

const getInterviewByRoomId = async (roomId) => {
  const room = await InterviewRoom.findOne({ roomId }).populate("questionId");
  if (!room) {
    throw new Error("No interview room found with this ID");
  }
  return room;
};

const getInterviewBySpaceId = async (spaceId) => {
  return InterviewRoom.findOne({ spaceId }).populate("questionId");
};

const getInterviewsByInterviewer = async (userId) => {
  return InterviewRoom.find({ "interviewer.userId": userId })
    .select("roomId spaceId title status candidate createdAt")
    .sort({ createdAt: -1 });
};

const joinAsCandidate = async (roomId, candidate) => {
  const room = await getInterviewByRoomId(roomId);

  if (room.status === "completed") {
    throw new Error("This interview has already ended");
  }

  if (
    room.candidate?.email &&
    room.candidate.email !== candidate.email
  ) {
    throw new Error("This interview already has a candidate assigned");
  }

  room.candidate = {
    userId: candidate.userId || null,
    name: candidate.name,
    email: candidate.email,
  };

  if (room.status === "waiting") {
    room.status = "in_progress";
    room.timer = applyStartToTimer(room.timer);
  }

  await room.save();
  return room;
};

const updateInterviewStatus = async (roomId, userId, status) => {
  const room = await getInterviewByRoomId(roomId);

  if (room.interviewer.userId.toString() !== userId.toString()) {
    throw new Error("Only the interviewer can update interview status");
  }

  const previousStatus = room.status;
  room.status = status;

  if (status === "in_progress") {
    room.timer =
      previousStatus === "paused"
        ? applyResumeToTimer(room.timer)
        : applyStartToTimer(room.timer);
  } else if (status === "paused") {
    room.timer = applyPauseToTimer(room.timer);
  } else if (status === "completed") {
    room.timer = applyStopToTimer(room.timer);
  }

  await room.save();

  return { room, previousStatus };
};

const expireInterviewTimer = async (roomId) => {
  const room = await getInterviewByRoomId(roomId);

  room.timer = {
    ...applyStopToTimer(room.timer),
    remainingSeconds: 0,
  };
  room.status = "completed";

  await room.save();
  return room;
};

const getRunningInterviewRooms = async () => {
  return InterviewRoom.find({
    status: "in_progress",
    "timer.isRunning": true,
  }).select("roomId");
};

const updateTimerDuration = async (roomId, userId, durationSeconds) => {
  const room = await getInterviewByRoomId(roomId);

  if (room.interviewer.userId.toString() !== userId.toString()) {
    throw new Error("Only the interviewer can update the timer");
  }

  if (room.timer.isRunning) {
    throw new Error("Pause the timer before changing duration");
  }

  if (!durationSeconds || durationSeconds < 60 || durationSeconds > 14400) {
    throw new Error("Duration must be between 1 and 240 minutes");
  }

  room.timer.durationSeconds = durationSeconds;
  room.timer.remainingSeconds = durationSeconds;

  await room.save();
  return room;
};

const getInterviewStateForParticipant = (room, participant) => {
  const { role, permissions } = buildInterviewContext(room, participant);
  const interviewData = room.publicInterviewData();

  return {
    ...interviewData,
    timer: getLiveTimerState(room.timer),
    role,
    permissions,
  };
};

const kickCandidate = async (roomId, userId) => {
  const room = await getInterviewByRoomId(roomId);

  if (room.interviewer.userId.toString() !== userId.toString()) {
    throw new Error("Only the interviewer can kick the candidate");
  }

  if (!room.candidate?.name) {
    throw new Error("No candidate to kick");
  }

  const kickedCandidate = {
    userId: room.candidate.userId,
    name: room.candidate.name,
    email: room.candidate.email,
  };

  room.candidate = {
    userId: null,
    name: null,
    email: null,
  };

  await room.save();

  return { room, kickedCandidate };
};

const getInterviewReport = async (roomId, userId) => {
  const room = await getInterviewByRoomId(roomId);

  if (room.interviewer.userId.toString() !== userId.toString()) {
    throw new Error("Only the interviewer can view reports");
  }

  return {
    roomId: room.roomId,
    title: room.title,
    status: room.status,
    interviewer: room.interviewer,
    candidate: room.candidate,
    durationSeconds: room.timer.durationSeconds,
    remainingSeconds: getLiveTimerState(room.timer).remainingSeconds,
    executionCount: room.executionHistory.length,
    question: room.publicInterviewData().question,
    createdAt: room.createdAt,
  };
};

const updateQuestion = async (roomId, userId, questionPayload) => {
  const room = await getInterviewByRoomId(roomId);

  if (room.interviewer.userId.toString() !== userId.toString()) {
    throw new Error("Only the interviewer can change the question");
  }

  let questionId = questionPayload.questionId;

  if (!questionId && questionPayload.title && questionPayload.description) {
    const newQuestion = await questionService.createQuestion(userId, questionPayload);
    questionId = newQuestion._id;
  }

  if (!questionId) {
    throw new Error("Question ID or question details are required");
  }

  await questionService.getQuestionById(questionId);

  room.questionId = questionId;
  await room.save();

  return getInterviewByRoomId(roomId);
};

const deleteInterviewRoom = async (roomId, userId) => {
  const room = await getInterviewByRoomId(roomId);

  if (room.interviewer.userId.toString() !== userId.toString()) {
    throw new Error("Only the interviewer can delete this interview");
  }

  const spaceId = room.spaceId || room.roomId;

  await InterviewRoom.deleteOne({ roomId });
  await Space.deleteOne({ spaceId });

  return { roomId, spaceId };
};

const assertSocketPermission = (interview, participant, permission) => {
  const role = resolveParticipantRole(interview, participant);

  if (permission === PERMISSIONS.WRITE_CODE) {
    return canWriteCode(interview, role);
  }

  return hasPermission(role, permission);
};

module.exports = {
  createInterviewRoom,
  ensureSpaceForInterview,
  repairOrphanedInterviewSpaces,
  getInterviewByRoomId,
  getInterviewBySpaceId,
  getInterviewsByInterviewer,
  joinAsCandidate,
  updateInterviewStatus,
  getInterviewStateForParticipant,
  kickCandidate,
  getInterviewReport,
  updateQuestion,
  assertSocketPermission,
  expireInterviewTimer,
  getRunningInterviewRooms,
  updateTimerDuration,
  deleteInterviewRoom,
  PERMISSIONS,
};
