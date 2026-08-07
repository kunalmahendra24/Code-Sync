const interviewRoomService = require("../services/interviewRoomService");
const timerService = require("../services/timerService");
const {
  broadcastInterviewUpdate,
  kickCandidateSocket,
  notifyInterviewDeleted,
} = require("../socket/interviewSocket");

let ioInstance = null;

const setSocketIO = (io) => {
  ioInstance = io;
  timerService.setSocketIO(io);
};

const getInterviews = async (req, res) => {
  try {
    const interviews = await interviewRoomService.getInterviewsByInterviewer(
      req.user._id
    );
    res.status(200).send(interviews);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const createInterview = async (req, res) => {
  try {
    const { roomId, title } = req.body;

    if (!roomId || !title?.trim()) {
      throw new Error("Room ID and title are required");
    }

    const interview = await interviewRoomService.createInterviewRoom({
      roomId,
      title: title.trim(),
      interviewer: {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
    });

    const interviews = await interviewRoomService.getInterviewsByInterviewer(
      req.user._id
    );

    const participant = { name: req.user.name, email: req.user.email };
    const interviewState = interviewRoomService.getInterviewStateForParticipant(
      interview,
      participant
    );

    res.status(201).send({ interview: interviewState, interviews });
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const getInterviewData = async (req, res) => {
  try {
    const room = await interviewRoomService.getInterviewByRoomId(req.params.id);

    let participant = {
      name: req.query.name,
      email: req.query.email || null,
      userId: null,
    };

    if (
      req.user &&
      room.interviewer.userId.toString() === req.user._id.toString()
    ) {
      participant = {
        name: req.user.name,
        email: req.user.email,
        userId: req.user._id,
      };
    } else if (!participant.name && req.user) {
      participant = {
        name: req.user.name,
        email: req.user.email,
        userId: req.user._id,
      };
    }

    if (participant.name || participant.email || participant.userId) {
      return res
        .status(200)
        .send(
          interviewRoomService.getInterviewStateForParticipant(room, participant)
        );
    }

    res.status(200).send(room.publicInterviewData());
  } catch (e) {
    res.status(404).send({ error: e.message });
  }
};

const joinInterview = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name?.trim()) {
      throw new Error("Name is required to join");
    }

    const participant = {
      userId: req.user?._id || null,
      name: name.trim(),
      email: email || null,
    };

    const room = await interviewRoomService.joinAsCandidate(
      req.params.id,
      participant
    );

    if (ioInstance) {
      await broadcastInterviewUpdate(ioInstance, req.params.id);
      if (room.status === "in_progress" && room.timer?.isRunning) {
        await timerService.handleTimerForStatus(req.params.id, "in_progress");
      }
    }

    res.status(200).send(
      interviewRoomService.getInterviewStateForParticipant(room, participant)
    );
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      throw new Error("Status is required");
    }

    const { room, previousStatus } = await interviewRoomService.updateInterviewStatus(
      req.params.id,
      req.user._id,
      status
    );

    if (ioInstance) {
      await timerService.handleTimerForStatus(req.params.id, status, previousStatus);
      await broadcastInterviewUpdate(ioInstance, req.params.id);
    }

    const participant = { name: req.user.name, email: req.user.email };
    res.status(200).send(
      interviewRoomService.getInterviewStateForParticipant(room, participant)
    );
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const kickCandidate = async (req, res) => {
  try {
    const { room, kickedCandidate } = await interviewRoomService.kickCandidate(
      req.params.id,
      req.user._id
    );

    if (ioInstance) {
      kickCandidateSocket(ioInstance, req.params.id, kickedCandidate);
      await broadcastInterviewUpdate(ioInstance, req.params.id);
    }

    const participant = { name: req.user.name, email: req.user.email };
    res.status(200).send(
      interviewRoomService.getInterviewStateForParticipant(room, participant)
    );
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const getReport = async (req, res) => {
  try {
    const report = await interviewRoomService.getInterviewReport(
      req.params.id,
      req.user._id
    );
    res.status(200).send(report);
  } catch (e) {
    res.status(403).send({ error: e.message });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const room = await interviewRoomService.updateQuestion(
      req.params.id,
      req.user._id,
      req.body
    );

    if (ioInstance) {
      await broadcastInterviewUpdate(ioInstance, req.params.id);
    }

    const participant = { name: req.user.name, email: req.user.email };
    res.status(200).send(
      interviewRoomService.getInterviewStateForParticipant(room, participant)
    );
  } catch (e) {
    res.status(403).send({ error: e.message });
  }
};

const updateTimer = async (req, res) => {
  try {
    const { durationSeconds } = req.body;

    const room = await interviewRoomService.updateTimerDuration(
      req.params.id,
      req.user._id,
      durationSeconds
    );

    if (ioInstance) {
      await timerService.broadcastTimerSync(req.params.id);
      await broadcastInterviewUpdate(ioInstance, req.params.id);
    }

    const participant = { name: req.user.name, email: req.user.email };
    res.status(200).send(
      interviewRoomService.getInterviewStateForParticipant(room, participant)
    );
  } catch (e) {
    res.status(403).send({ error: e.message });
  }
};

const deleteInterview = async (req, res) => {
  try {
    const { roomId } = await interviewRoomService.deleteInterviewRoom(
      req.params.id,
      req.user._id
    );

    timerService.stopTimerInterval(roomId);

    if (ioInstance) {
      notifyInterviewDeleted(ioInstance, roomId);
    }

    const interviews = await interviewRoomService.getInterviewsByInterviewer(
      req.user._id
    );

    res.status(200).send(interviews);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

module.exports = {
  getInterviews,
  createInterview,
  getInterviewData,
  joinInterview,
  updateStatus,
  kickCandidate,
  getReport,
  updateQuestion,
  updateTimer,
  deleteInterview,
  setSocketIO,
};
