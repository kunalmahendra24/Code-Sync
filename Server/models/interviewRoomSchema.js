const mongoose = require("mongoose");
const { getLiveTimerState } = require("../utils/timerUtils");

const INTERVIEW_STATUS = ["waiting", "in_progress", "paused", "completed"];

const interviewRoomSchema = mongoose.Schema(
  {
    roomId: {
      type: String,
      unique: true,
      required: true,
    },
    spaceId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    interviewer: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    candidate: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      name: { type: String, default: null },
      email: { type: String, default: null },
    },
    status: {
      type: String,
      enum: INTERVIEW_STATUS,
      default: "waiting",
    },
    timer: {
      durationSeconds: { type: Number, default: 3600 },
      remainingSeconds: { type: Number, default: 3600 },
      startedAt: { type: Date, default: null },
      isRunning: { type: Boolean, default: false },
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      default: null,
    },
    executionHistory: [
      {
        language: String,
        code: String,
        output: String,
        error: String,
        executionTimeMs: Number,
        memoryUsedKb: Number,
        executedAt: { type: Date, default: Date.now },
        executedBy: {
          name: String,
          email: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

interviewRoomSchema.methods.publicInterviewData = function () {
  const room = this;

  const question =
    room.questionId && typeof room.questionId === "object"
      ? room.questionId.publicQuestionData?.() || room.questionId
      : null;

  return {
    roomId: room.roomId,
    spaceId: room.spaceId,
    title: room.title,
    interviewer: room.interviewer,
    candidate: room.candidate,
    status: room.status,
    timer: getLiveTimerState(room.timer),
    questionId: question?._id || room.questionId || null,
    question,
    executionHistory: room.executionHistory,
    createdAt: room.createdAt,
  };
};

const InterviewRoom = mongoose.model("InterviewRoom", interviewRoomSchema);

module.exports = InterviewRoom;
module.exports.INTERVIEW_STATUS = INTERVIEW_STATUS;
