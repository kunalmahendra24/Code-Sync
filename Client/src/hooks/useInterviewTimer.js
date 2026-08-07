import { useEffect, useRef, useState } from "react";

const useInterviewTimer = (timer, isRunningOverride) => {
  const [displaySeconds, setDisplaySeconds] = useState(
    timer?.remainingSeconds ?? 0
  );
  const [isRunning, setIsRunning] = useState(Boolean(timer?.isRunning));
  const syncRef = useRef({ serverTime: Date.now(), remainingSeconds: 0 });

  useEffect(() => {
    if (!timer) return;

    syncRef.current = {
      serverTime: timer.serverTime || Date.now(),
      remainingSeconds: timer.remainingSeconds ?? 0,
    };

    setDisplaySeconds(timer.remainingSeconds ?? 0);
    setIsRunning(
      isRunningOverride !== undefined
        ? isRunningOverride
        : Boolean(timer.isRunning)
    );
  }, [timer, isRunningOverride]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - syncRef.current.serverTime) / 1000);
      const next = Math.max(0, syncRef.current.remainingSeconds - elapsed);
      setDisplaySeconds(next);
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning, timer?.serverTime, timer?.remainingSeconds]);

  return { displaySeconds, isRunning };
};

export default useInterviewTimer;
