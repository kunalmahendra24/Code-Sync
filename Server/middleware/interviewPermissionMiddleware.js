const {
  hasPermission,
  resolveParticipantRole,
} = require("../utils/permissions");
const interviewRoomService = require("../services/interviewRoomService");

const requireInterviewPermission = (permission) => async (req, res, next) => {
  try {
    const room = await interviewRoomService.getInterviewByRoomId(req.params.id);

    const participant = {
      name: req.user?.name || req.body?.name,
      email: req.user?.email || req.body?.email || null,
    };

    const role = resolveParticipantRole(room, participant);

    if (!hasPermission(role, permission)) {
      return res.status(403).send({
        error: `You do not have permission to perform this action (${permission})`,
      });
    }

    req.interviewRoom = room;
    req.interviewRole = role;
    next();
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

module.exports = { requireInterviewPermission };
