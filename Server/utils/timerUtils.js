const computeRemainingSeconds = (timer = {}) => {
  if (!timer.isRunning || !timer.startedAt) {
    return Math.max(0, timer.remainingSeconds ?? 0);
  }

  const elapsed = Math.floor(
    (Date.now() - new Date(timer.startedAt).getTime()) / 1000
  );

  return Math.max(0, (timer.remainingSeconds ?? 0) - elapsed);
};

const getLiveTimerState = (timer = {}) => ({
  durationSeconds: timer.durationSeconds ?? 3600,
  remainingSeconds: computeRemainingSeconds(timer),
  isRunning: Boolean(timer.isRunning),
  startedAt: timer.startedAt ?? null,
  serverTime: Date.now(),
});

const applyPauseToTimer = (timer = {}) => {
  const remainingSeconds = computeRemainingSeconds(timer);

  return {
    durationSeconds: timer.durationSeconds ?? 3600,
    remainingSeconds,
    startedAt: null,
    isRunning: false,
  };
};

const applyResumeToTimer = (timer = {}) => ({
  durationSeconds: timer.durationSeconds ?? 3600,
  remainingSeconds: computeRemainingSeconds(timer),
  startedAt: new Date(),
  isRunning: true,
});

const applyStartToTimer = (timer = {}) => ({
  durationSeconds: timer.durationSeconds ?? 3600,
  remainingSeconds: timer.remainingSeconds ?? timer.durationSeconds ?? 3600,
  startedAt: new Date(),
  isRunning: true,
});

const applyStopToTimer = (timer = {}) => ({
  durationSeconds: timer.durationSeconds ?? 3600,
  remainingSeconds: computeRemainingSeconds(timer),
  startedAt: null,
  isRunning: false,
});

module.exports = {
  computeRemainingSeconds,
  getLiveTimerState,
  applyPauseToTimer,
  applyResumeToTimer,
  applyStartToTimer,
  applyStopToTimer,
};
