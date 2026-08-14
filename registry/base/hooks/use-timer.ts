"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type TimerStatus = "idle" | "running" | "paused" | "completed";

export type TimerControls = {
  pause: () => void;
  resume: () => void;
  reset: () => void;
  restart: () => void;
};

export type UseTimerOptions = {
  direction: "down" | "up";
  initialSeconds: number;
  endSeconds?: number;
  autoStart?: boolean;
  disabled?: boolean;
  onComplete?: () => void;
};

export type UseTimerReturn = TimerControls & {
  seconds: number;
  status: TimerStatus;
  isRunning: boolean;
};

export type UseCountdownOptions = Omit<
  UseTimerOptions,
  "direction" | "initialSeconds" | "endSeconds"
> & {
  duration: number;
};

export type UseCountUpOptions = Omit<
  UseTimerOptions,
  "direction" | "initialSeconds" | "endSeconds"
> & {
  startAt?: number;
  endAt?: number;
};

type TimerAnchor = {
  startedAt: number;
  valueMs: number;
};

export function useTimer({
  direction,
  initialSeconds,
  endSeconds,
  autoStart = true,
  disabled = false,
  onComplete,
}: UseTimerOptions): UseTimerReturn {
  const initialMs = toMilliseconds(initialSeconds, "initialSeconds");
  const endMs =
    endSeconds === undefined
      ? undefined
      : toMilliseconds(endSeconds, "endSeconds");

  validateBoundary(direction, initialMs, endMs);

  const startsAtBoundary = hasReachedBoundary(direction, initialMs, endMs);
  const initialStatus: TimerStatus = startsAtBoundary
    ? "completed"
    : autoStart && !disabled
      ? "running"
      : "idle";
  const [valueMs, setValueMs] = useState(initialMs);
  const [status, setStatus] = useState<TimerStatus>(initialStatus);
  const valueRef = useRef(initialMs);
  const statusRef = useRef<TimerStatus>(initialStatus);
  const anchorRef = useRef<TimerAnchor>({
    startedAt: 0,
    valueMs: initialMs,
  });
  const definitionRef = useRef({ direction, initialMs, endMs });
  const onCompleteRef = useRef(onComplete);
  const completionNotifiedRef = useRef(startsAtBoundary);
  const wasDisabledRef = useRef(disabled);
  const resumeAfterDisabledRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const commit = useCallback((nextValueMs: number, nextStatus: TimerStatus) => {
    valueRef.current = nextValueMs;
    statusRef.current = nextStatus;
    setValueMs(nextValueMs);
    setStatus(nextStatus);
  }, []);

  const readCurrentValue = useCallback(
    (now: number) => {
      const elapsed = Math.max(0, now - anchorRef.current.startedAt);
      const nextValue =
        direction === "down"
          ? anchorRef.current.valueMs - elapsed
          : anchorRef.current.valueMs + elapsed;

      return clampToBoundary(direction, nextValue, endMs);
    },
    [direction, endMs],
  );

  const complete = useCallback(
    (nextValueMs: number) => {
      commit(nextValueMs, "completed");

      if (!completionNotifiedRef.current) {
        completionNotifiedRef.current = true;
        onCompleteRef.current?.();
      }
    },
    [commit],
  );

  const freeze = useCallback(() => {
    if (statusRef.current !== "running") return;

    const nextValue = readCurrentValue(Date.now());

    if (hasReachedBoundary(direction, nextValue, endMs)) {
      complete(nextValue);
      return;
    }

    commit(nextValue, "paused");
  }, [commit, complete, direction, endMs, readCurrentValue]);

  const pause = useCallback(() => {
    resumeAfterDisabledRef.current = false;
    freeze();
  }, [freeze]);

  const resume = useCallback(() => {
    if (
      disabled ||
      statusRef.current === "running" ||
      hasReachedBoundary(direction, valueRef.current, endMs)
    ) {
      return;
    }

    resumeAfterDisabledRef.current = false;
    anchorRef.current = {
      startedAt: Date.now(),
      valueMs: valueRef.current,
    };
    commit(valueRef.current, "running");
  }, [commit, direction, disabled, endMs]);

  const reset = useCallback(() => {
    resumeAfterDisabledRef.current = false;
    completionNotifiedRef.current = startsAtBoundary;
    anchorRef.current = { startedAt: Date.now(), valueMs: initialMs };
    commit(initialMs, startsAtBoundary ? "completed" : "idle");
  }, [commit, initialMs, startsAtBoundary]);

  const restart = useCallback(() => {
    if (disabled) return;

    completionNotifiedRef.current = startsAtBoundary;
    anchorRef.current = { startedAt: Date.now(), valueMs: initialMs };
    commit(initialMs, startsAtBoundary ? "completed" : "running");
  }, [commit, disabled, initialMs, startsAtBoundary]);

  useEffect(() => {
    const previous = definitionRef.current;
    const definitionChanged =
      previous.direction !== direction ||
      previous.initialMs !== initialMs ||
      previous.endMs !== endMs;

    if (!definitionChanged) return;

    definitionRef.current = { direction, initialMs, endMs };
    completionNotifiedRef.current = startsAtBoundary;
    anchorRef.current = { startedAt: Date.now(), valueMs: initialMs };
    commit(
      initialMs,
      startsAtBoundary
        ? "completed"
        : autoStart && !disabled
          ? "running"
          : "idle",
    );
  }, [
    autoStart,
    commit,
    direction,
    disabled,
    endMs,
    initialMs,
    startsAtBoundary,
  ]);

  useEffect(() => {
    const wasDisabled = wasDisabledRef.current;
    wasDisabledRef.current = disabled;
    let timeout = 0;

    if (disabled) {
      resumeAfterDisabledRef.current = statusRef.current === "running";
      timeout = window.setTimeout(freeze, 0);
    } else if (wasDisabled && resumeAfterDisabledRef.current) {
      resumeAfterDisabledRef.current = false;
      timeout = window.setTimeout(resume, 0);
    }

    return () => window.clearTimeout(timeout);
  }, [disabled, freeze, resume]);

  useEffect(() => {
    if (status !== "running" || disabled) return;

    let timeout = 0;

    if (anchorRef.current.startedAt === 0) {
      anchorRef.current = {
        startedAt: Date.now(),
        valueMs: valueRef.current,
      };
    }

    function tick() {
      const nextValue = readCurrentValue(Date.now());

      if (hasReachedBoundary(direction, nextValue, endMs)) {
        complete(nextValue);
        return;
      }

      commit(nextValue, "running");
      timeout = window.setTimeout(
        tick,
        millisecondsUntilNextSecond(nextValue, direction),
      );
    }

    timeout = window.setTimeout(
      tick,
      millisecondsUntilNextSecond(valueRef.current, direction),
    );

    return () => window.clearTimeout(timeout);
  }, [commit, complete, direction, disabled, endMs, readCurrentValue, status]);

  const seconds =
    direction === "down"
      ? Math.ceil(valueMs / 1000)
      : Math.floor(valueMs / 1000);

  return {
    seconds,
    status,
    isRunning: status === "running",
    pause,
    resume,
    reset,
    restart,
  };
}

export function useCountdown({
  duration,
  ...options
}: UseCountdownOptions): UseTimerReturn {
  return useTimer({
    ...options,
    direction: "down",
    initialSeconds: duration,
    endSeconds: 0,
  });
}

export function useCountUp({
  startAt = 0,
  endAt,
  ...options
}: UseCountUpOptions = {}): UseTimerReturn {
  return useTimer({
    ...options,
    direction: "up",
    initialSeconds: startAt,
    endSeconds: endAt,
  });
}

function toMilliseconds(seconds: number, name: string) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new RangeError(`${name} must be a finite, non-negative number.`);
  }

  const milliseconds = seconds * 1000;

  if (!Number.isSafeInteger(milliseconds)) {
    throw new RangeError(`${name} is outside the supported timer range.`);
  }

  return milliseconds;
}

function validateBoundary(
  direction: "down" | "up",
  initialMs: number,
  endMs: number | undefined,
) {
  if (direction === "down" && endMs !== undefined && endMs > initialMs) {
    throw new RangeError(
      "A countdown endSeconds value cannot be greater than initialSeconds.",
    );
  }

  if (direction === "up" && endMs !== undefined && endMs < initialMs) {
    throw new RangeError(
      "A count-up endSeconds value cannot be less than initialSeconds.",
    );
  }
}

function clampToBoundary(
  direction: "down" | "up",
  valueMs: number,
  endMs: number | undefined,
) {
  if (endMs === undefined) return Math.max(0, valueMs);

  return direction === "down"
    ? Math.max(endMs, valueMs)
    : Math.min(endMs, valueMs);
}

function hasReachedBoundary(
  direction: "down" | "up",
  valueMs: number,
  endMs: number | undefined,
) {
  if (endMs === undefined) return false;

  return direction === "down" ? valueMs <= endMs : valueMs >= endMs;
}

function millisecondsUntilNextSecond(
  valueMs: number,
  direction: "down" | "up",
) {
  const remainder = valueMs % 1000;
  const delay =
    direction === "down"
      ? remainder === 0
        ? 1000
        : remainder
      : remainder === 0
        ? 1000
        : 1000 - remainder;

  return Math.max(16, delay);
}
