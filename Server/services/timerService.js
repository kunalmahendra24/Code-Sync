const ACTIONS = require("../Actions");
const interviewRoomService = require("./interviewRoomService");
const { getLiveTimerState } = require("../utils/timerUtils");

let ioInstance = null;
const activeTimers = new Map();

const setSocketIO = (io) => {
  ioInstance = io;
};

const broadcastTimerSync = async (roomId) => {
  if (!ioInstance) return;

  const room = await interviewRoomService.getInterviewByRoomId(roomId);
  if (!room) return;

  const timer = getLiveTimerState(room.timer);

  ioInstance.to(`interview:${roomId}`).emit(ACTIONS.INTERVIEW_TIMER_SYNC, timer);
};

const stopTimerInterval = (roomId) => {
  const interval = activeTimers.get(roomId);
  if (interval) {
    clearInterval(interval);
    activeTimers.delete(roomId);
  }
};

const startTimerInterval = (roomId) => {
  stopTimerInterval(roomId);

  const interval = setInterval(async () => {
    try {
      const room = await interviewRoomService.getInterviewByRoomId(roomId);

      if (!room?.timer?.isRunning) {
        stopTimerInterval(roomId);
        return;
      }

      const timer = getLiveTimerState(room.timer);

      if (timer.remainingSeconds <= 0) {
        await interviewRoomService.expireInterviewTimer(roomId);
        stopTimerInterval(roomId);
        await broadcastTimerSync(roomId);

        const { broadcastInterviewUpdate } = require("../socket/interviewSocket");
        await broadcastInterviewUpdate(ioInstance, roomId);
        return;
      }

      ioInstance
        .to(`interview:${roomId}`)
        .emit(ACTIONS.INTERVIEW_TIMER_TICK, timer);
    } catch (e) {
      console.log(e);
    }
  }, 1000);

  activeTimers.set(roomId, interval);
};

const handleTimerForStatus = async (roomId, status, previousStatus) => {
  if (status === "in_progress") {
    startTimerInterval(roomId);
    await broadcastTimerSync(roomId);
    return;
  }

  if (status === "paused") {
    stopTimerInterval(roomId);
    await broadcastTimerSync(roomId);
    return;
  }

  if (status === "completed") {
    stopTimerInterval(roomId);
    await broadcastTimerSync(roomId);
  }
};

const resumeActiveTimers = async () => {
  try {
    const rooms = await interviewRoomService.getRunningInterviewRooms();
    rooms.forEach((room) => startTimerInterval(room.roomId));
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  setSocketIO,
  broadcastTimerSync,
  startTimerInterval,
  stopTimerInterval,
  handleTimerForStatus,
  resumeActiveTimers,
};
