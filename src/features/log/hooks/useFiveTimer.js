window.FiveApp = window.FiveApp || {};
window.FiveApp.logHooks = window.FiveApp.logHooks || {};

function useFiveTimer({ duration }) {
  const { useState, useEffect, useRef } = React;

  const [timeLeft, setTimeLeft] = useState(duration);
  const [running, setRunning] = useState(false);
  const [justLogged, setJustLogged] = useState(false);
  const intervalRef = useRef(null);
  const wakeLockRef = useRef(null);
  const onCompleteRef = useRef(() => {});

  const acquireWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) wakeLockRef.current = await navigator.wakeLock.request("screen");
    } catch (e) {}
  };

  const releaseWakeLock = async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch (e) {}
  };

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible" && running) acquireWakeLock();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [running]);

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setRunning(false);
            onCompleteRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [running, timeLeft]);

  const startTimer = () => {
    setJustLogged(false);
    setTimeLeft(duration);
    setRunning(true);
    acquireWakeLock();
  };
  const pauseTimer = () => { setRunning(false); releaseWakeLock(); };
  const resetTimer = () => { setRunning(false); setTimeLeft(duration); setJustLogged(false); releaseWakeLock(); };
  const setOnComplete = (handler) => { onCompleteRef.current = handler; };

  return {
    timeLeft,
    running,
    justLogged,
    setJustLogged,
    startTimer,
    pauseTimer,
    resetTimer,
    releaseWakeLock,
    setOnComplete,
  };
}

window.FiveApp.logHooks.useFiveTimer = useFiveTimer;
