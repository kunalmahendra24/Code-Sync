const ACTIONS = require("../Actions");
const interviewRoomService = require("../services/interviewRoomService");
const timerService = require("../services/timerService");
const { buildInterviewContext } = require("../utils/permissions");
const { getLiveTimerState } = require("../utils/timerUtils");

const interviewSocketRegistry = new Map();

const getRegistryKey = (roomId, participant) =>
  `${roomId}:${participant.email || participant.name}`;

const registerInterviewSocketHandlers = (io, socket) => {
  socket.on(ACTIONS.INTERVIEW_JOIN, async ({ roomId, name, email, userId }) => {
    try {
      if (!roomId || !name) return;

      const room = await interviewRoomService.getInterviewBySpaceId(roomId);
      if (!room) return;

      const participant = {
        name,
        email: email ?? null,
        userId: userId ?? null,
      };
      const { role, permissions } = buildInterviewContext(room, participant);

      socket.data.interviewRoomId = roomId;
      socket.data.interviewRole = role;
      socket.data.interviewParticipant = participant;

      socket.join(`interview:${roomId}`);
      interviewSocketRegistry.set(getRegistryKey(roomId, participant), socket.id);

      const interviewState = interviewRoomService.getInterviewStateForParticipant(
        room,
        participant
      );

      socket.emit(ACTIONS.INTERVIEW_STATE, interviewState);
      socket
        .to(`interview:${roomId}`)
        .emit(ACTIONS.INTERVIEW_UPDATE, interviewState);

      if (room.timer?.isRunning) {
        socket.emit(ACTIONS.INTERVIEW_TIMER_SYNC, getLiveTimerState(room.timer));
      }
    } catch (e) {
      console.log(e);
    }
  });

  socket.on(ACTIONS.INTERVIEW_SYNC, async ({ roomId }) => {
    try {
      if (!roomId) return;

      const room = await interviewRoomService.getInterviewBySpaceId(roomId);
      if (!room) return;

      io.to(`interview:${roomId}`).emit(
        ACTIONS.INTERVIEW_STATE,
        room.publicInterviewData()
      );
    } catch (e) {
      console.log(e);
    }
  });

  socket.on("disconnect", () => {
    const { interviewRoomId, interviewParticipant } = socket.data || {};
    if (!interviewRoomId || !interviewParticipant) return;

    interviewSocketRegistry.delete(
      getRegistryKey(interviewRoomId, interviewParticipant)
    );
  });
};

const broadcastInterviewUpdate = async (io, roomId) => {
  try {
    const room = await interviewRoomService.getInterviewByRoomId(roomId);
    if (!room) return;

    const interviewData = room.publicInterviewData();

    io.to(`interview:${roomId}`).emit(ACTIONS.INTERVIEW_UPDATE, interviewData);

    if (interviewData.question) {
      io.to(`interview:${roomId}`).emit(
        ACTIONS.INTERVIEW_QUESTION_UPDATE,
        interviewData.question
      );
    }
  } catch (e) {
    console.log(e);
  }
};

const kickCandidateSocket = (io, roomId, kickedCandidate) => {
  const key = getRegistryKey(roomId, kickedCandidate);
  const socketId = interviewSocketRegistry.get(key);

  if (socketId) {
    io.to(socketId).emit(ACTIONS.INTERVIEW_KICKED, {
      message: "You have been removed from the interview by the interviewer.",
    });
    interviewSocketRegistry.delete(key);
  }
};

const notifyInterviewDeleted = (io, roomId) => {
  io.to(`interview:${roomId}`).emit(ACTIONS.INTERVIEW_DELETED, {
    message: "This interview room has been deleted by the interviewer.",
    roomId,
  });

  for (const key of interviewSocketRegistry.keys()) {
    if (key.startsWith(`${roomId}:`)) {
      interviewSocketRegistry.delete(key);
    }
  }
};

const validateInterviewSocketAction = async (socket, permission) => {
  const { interviewRoomId, interviewParticipant } = socket.data || {};
  if (!interviewRoomId) return true;

  const room = await interviewRoomService.getInterviewBySpaceId(interviewRoomId);
  if (!room) return true;

  const allowed = interviewRoomService.assertSocketPermission(
    room,
    interviewParticipant,
    permission
  );

  if (!allowed) {
    socket.emit(ACTIONS.INTERVIEW_PERMISSION_DENIED, {
      permission,
      message: `You do not have permission: ${permission}`,
    });
  }

  return allowed;
};

module.exports = {
  registerInterviewSocketHandlers,
  broadcastInterviewUpdate,
  kickCandidateSocket,
  notifyInterviewDeleted,
  validateInterviewSocketAction,
};
