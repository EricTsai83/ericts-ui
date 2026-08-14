"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  type ComponentPropsWithoutRef,
  type ForwardedRef,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import {
  useCountdown,
  useCountUp,
  type TimerControls,
  type TimerStatus,
} from "@/hooks/use-timer";
import { cn } from "@/lib/utils";

const DIGIT_TRANSITION = {
  duration: 0.2,
  ease: [0.645, 0.045, 0.355, 1],
} as const;

type TimerDirection = "down" | "up";

type TimerDisplayProps = Omit<
  ComponentPropsWithoutRef<"time">,
  "children"
> & {
  seconds: number;
  direction: TimerDirection;
  status: TimerStatus;
  animated?: boolean;
  disabled?: boolean;
  valueClassName?: string;
  digitClassName?: string;
  separatorClassName?: string;
};

export type TimerHandle = TimerControls;

type SharedTimerProps = Omit<
  ComponentPropsWithoutRef<"time">,
  "children"
> & {
  /** Start automatically on mount. */
  autoStart?: boolean;
  /** Declaratively pause or resume the timer. */
  paused?: boolean;
  /** Freeze the timer and prevent resume or restart. */
  disabled?: boolean;
  /** Animate digit changes. Reduced-motion preferences still take precedence. */
  animated?: boolean;
  /** Called once when the timer reaches its boundary. */
  onComplete?: () => void;
  /** Classes applied to each hours, minutes, and seconds segment. */
  valueClassName?: string;
  /** Classes applied to every animated digit slot. */
  digitClassName?: string;
  /** Classes applied to both separators. */
  separatorClassName?: string;
};

export type CountdownProps = SharedTimerProps & {
  /** Countdown duration in seconds. */
  duration: number;
};

export type CountUpProps = SharedTimerProps & {
  /** Initial elapsed time in seconds. */
  startAt?: number;
  /** Optional elapsed-time boundary in seconds. */
  endAt?: number;
};

export const Countdown = forwardRef<TimerHandle, CountdownProps>(
  function Countdown(
    {
      duration,
      autoStart = true,
      paused,
      disabled = false,
      onComplete,
      ...props
    },
    ref,
  ) {
    const timer = useCountdown({
      duration,
      autoStart,
      disabled,
      onComplete,
    });

    useTimerHandle(ref, timer);
    usePausedProp(paused, timer);

    return (
      <TimerDisplay
        seconds={timer.seconds}
        direction="down"
        status={timer.status}
        disabled={disabled}
        {...props}
      />
    );
  },
);

export const CountUp = forwardRef<TimerHandle, CountUpProps>(function CountUp(
  {
    startAt = 0,
    endAt,
    autoStart = true,
    paused,
    disabled = false,
    onComplete,
    ...props
  },
  ref,
) {
  const timer = useCountUp({
    startAt,
    endAt,
    autoStart,
    disabled,
    onComplete,
  });

  useTimerHandle(ref, timer);
  usePausedProp(paused, timer);

  return (
    <TimerDisplay
      seconds={timer.seconds}
      direction="up"
      status={timer.status}
      disabled={disabled}
      {...props}
    />
  );
});

function TimerDisplay({
  seconds: totalSeconds,
  direction,
  status,
  animated = true,
  disabled = false,
  className,
  valueClassName,
  digitClassName,
  separatorClassName,
  "aria-label": ariaLabel,
  "aria-live": ariaLive = "off",
  dateTime,
  ...props
}: TimerDisplayProps) {
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = animated && !shouldReduceMotion;
  const { hours, minutes, seconds } = splitTime(totalSeconds);
  const values = [hours, minutes, seconds];
  const labelSuffix = direction === "down" ? "remaining" : "elapsed";

  return (
    <time
      role="timer"
      aria-label={
        ariaLabel ??
        `${formatUnit(hours, "hour")}, ${formatUnit(minutes, "minute")}, ${formatUnit(seconds, "second")} ${labelSuffix}`
      }
      aria-live={ariaLive}
      dateTime={dateTime ?? toDuration(totalSeconds)}
      data-slot={direction === "down" ? "countdown" : "count-up"}
      data-state={status}
      data-value={totalSeconds}
      data-animated={shouldAnimate}
      data-disabled={disabled || undefined}
      className={cn(
        "inline-flex items-center gap-2 font-mono text-2xl font-semibold tabular-nums",
        disabled && "opacity-50",
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="contents">
        {values.map((value, index) => (
          <span key={index} className="contents">
            {index > 0 ? (
              <span
                data-slot="timer-separator"
                className={cn(
                  "leading-none text-muted-foreground",
                  separatorClassName,
                )}
              >
                :
              </span>
            ) : null}
            <TimerSegment
              value={value}
              direction={direction}
              animated={shouldAnimate}
              className={valueClassName}
              digitClassName={digitClassName}
            />
          </span>
        ))}
      </span>
    </time>
  );
}

function TimerSegment({
  value,
  direction,
  animated,
  className,
  digitClassName,
}: {
  value: number;
  direction: TimerDirection;
  animated: boolean;
  className?: string;
  digitClassName?: string;
}) {
  const digits = String(value).padStart(2, "0").split("");

  return (
    <span
      data-slot="timer-segment"
      data-value={value}
      className={cn("inline-flex items-center", className)}
    >
      {digits.map((digit, index) => (
        <TimerDigit
          key={`place-${digits.length - index - 1}`}
          digit={digit}
          direction={direction}
          animated={animated}
          className={digitClassName}
        />
      ))}
    </span>
  );
}

function TimerDigit({
  digit,
  direction,
  animated,
  className,
}: {
  digit: string;
  direction: TimerDirection;
  animated: boolean;
  className?: string;
}) {
  const distance = direction === "down" ? "-100%" : "100%";

  return (
    <span
      aria-hidden="true"
      data-digit={digit}
      data-slot="timer-digit"
      className={cn(
        "relative inline-block w-[1ch] overflow-hidden leading-none",
        className,
      )}
    >
      <span className="invisible">0</span>
      {animated ? (
        <AnimatePresence initial={false}>
          <motion.span
            key={digit}
            data-number={digit}
            initial={{ y: distance, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{
              y: direction === "down" ? "100%" : "-100%",
              opacity: 0,
            }}
            transition={DIGIT_TRANSITION}
            className="absolute inset-0 flex items-center justify-center"
          >
            {digit}
          </motion.span>
        </AnimatePresence>
      ) : (
        <span
          data-number={digit}
          className="absolute inset-0 flex items-center justify-center"
        >
          {digit}
        </span>
      )}
    </span>
  );
}

function useTimerHandle(
  ref: ForwardedRef<TimerHandle>,
  timer: TimerControls,
) {
  useImperativeHandle(
    ref,
    () => ({
      pause: timer.pause,
      resume: timer.resume,
      reset: timer.reset,
      restart: timer.restart,
    }),
    [timer.pause, timer.reset, timer.restart, timer.resume],
  );
}

function usePausedProp(
  paused: boolean | undefined,
  timer: Pick<TimerControls, "pause" | "resume">,
) {
  const { pause, resume } = timer;

  useEffect(() => {
    if (paused === true) {
      pause();
    } else if (paused === false) {
      resume();
    }
  }, [pause, paused, resume]);
}

function splitTime(totalSeconds: number) {
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function formatUnit(value: number, unit: string) {
  return `${value} ${unit}${value === 1 ? "" : "s"}`;
}

function toDuration(totalSeconds: number) {
  const { hours, minutes, seconds } = splitTime(totalSeconds);

  return `PT${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}${seconds || (!hours && !minutes) ? `${seconds}S` : ""}`;
}
