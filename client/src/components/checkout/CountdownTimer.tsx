"use client";

import { useEffect, useState, useRef, useCallback } from "react";

type CountdownTimerProps = {
  /** Duration in seconds (e.g. 300 = 5 minutes) */
  durationSeconds: number;
  /** Called when the timer reaches zero */
  onExpire: () => void;
  /** Optional: whether to pause the timer */
  paused?: boolean;
};

export default function CountdownTimer({
  durationSeconds,
  onExpire,
  paused = false,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (paused || remaining <= 0) return;

    const tick = window.setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0 && !expiredRef.current) {
          expiredRef.current = true;
          setTimeout(() => onExpireRef.current(), 0);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(tick);
  }, [paused, remaining]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = durationSeconds > 0 ? remaining / durationSeconds : 0;
  const isLow = remaining <= 60;

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference * (1 - progress);

  const handleReset = useCallback(() => {
    expiredRef.current = false;
    setRemaining(durationSeconds);
  }, [durationSeconds]);

  // Expose reset to parent via data attribute
  useEffect(() => {
    const el = document.getElementById("countdown-timer-root");
    if (el) {
      (el as unknown as { resetTimer: () => void }).resetTimer = handleReset;
    }
  }, [handleReset]);

  return (
    <div id="countdown-timer-root" className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center">
        <svg
          width="96"
          height="96"
          viewBox="0 0 96 96"
          className="rotate-[-90deg]"
        >
          {/* Background circle */}
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-slate-200"
          />
          {/* Progress circle */}
          <circle
            cx="48"
            cy="48"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-1000 ease-linear ${
              isLow ? "text-rose-500" : "text-emerald-500"
            }`}
          />
        </svg>

        <span
          className={`absolute text-lg font-bold tabular-nums ${
            isLow ? "text-rose-600" : "text-slate-800"
          }`}
        >
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </div>

      <p
        className={`text-xs font-medium ${
          isLow ? "text-rose-500 animate-pulse" : "text-slate-500"
        }`}
      >
        {remaining <= 0
          ? "Time expired"
          : isLow
            ? "Hurry! Almost out of time"
            : "Time remaining"}
      </p>
    </div>
  );
}
