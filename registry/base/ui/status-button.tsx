"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonProps = React.ComponentProps<typeof Button>;
type ButtonClickEvent = Parameters<NonNullable<ButtonProps["onClick"]>>[0];
type ButtonState = "idle" | "loading" | "success";

export type StatusButtonProps = Omit<ButtonProps, "children" | "onClick"> & {
  idleLabel?: React.ReactNode;
  loadingLabel?: React.ReactNode;
  successLabel?: React.ReactNode;
  /**
   * Minimum time in ms the loading state stays visible, so quick requests
   * don't flash. Slow requests keep loading until `onClick` settles.
   */
  loadingDuration?: number;
  /** Time in ms the success state stays visible before returning to idle. */
  successDuration?: number;
  /** Announced to screen readers while loading. Defaults to a string `loadingLabel`. */
  loadingAnnouncement?: string;
  /** Announced to screen readers on success. Defaults to a string `successLabel`. */
  successAnnouncement?: string;
  onClick?: (event: ButtonClickEvent) => void | Promise<void>;
  /**
   * Called when `onClick` rejects. Without this the button silently returns to
   * idle, which is indistinguishable from never having been pressed.
   */
  onError?: (error: unknown) => void;
};

function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70",
        className
      )}
    />
  );
}

export function StatusButton({
  idleLabel = "Submit",
  loadingLabel = <Spinner />,
  successLabel = "Done",
  loadingDuration = 1750,
  successDuration = 1750,
  loadingAnnouncement,
  successAnnouncement,
  disabled,
  className,
  onClick,
  onError,
  type = "button",
  ...props
}: StatusButtonProps) {
  const [buttonState, setButtonState] = React.useState<ButtonState>("idle");
  const shouldReduceMotion = useReducedMotion();
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const clearTimers = React.useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const handleClick = React.useCallback(
    async (event: ButtonClickEvent) => {
      if (buttonState !== "idle") return;

      setButtonState("loading");
      clearTimers();

      const startedAt = Date.now();

      try {
        await onClick?.(event);
      } catch (error) {
        if (!isMountedRef.current) return;
        setButtonState("idle");
        onError?.(error);
        return;
      }

      if (!isMountedRef.current) return;

      // `loadingDuration` is a floor, not an added delay: fast requests hold
      // the spinner long enough to read, slow ones switch as soon as they end.
      const remaining = Math.max(0, loadingDuration - (Date.now() - startedAt));

      timers.current = [
        setTimeout(() => {
          setButtonState("success");
        }, remaining),
        setTimeout(() => {
          setButtonState("idle");
        }, remaining + successDuration),
      ];
    },
    [
      buttonState,
      clearTimers,
      loadingDuration,
      onClick,
      onError,
      successDuration,
    ]
  );

  const copy: Record<ButtonState, React.ReactNode> = {
    idle: idleLabel,
    loading: loadingLabel,
    success: successLabel,
  };

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : ({ type: "spring", duration: 0.3, bounce: 0 } as const);

  return (
    <Button
      type={type}
      disabled={disabled || buttonState === "loading"}
      onClick={handleClick}
      className={cn("min-w-44 overflow-hidden", className)}
      {...props}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={buttonState}
          initial={shouldReduceMotion ? false : { opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, y: 24 }}
          transition={transition}
          className="inline-flex items-center justify-center gap-1.5"
        >
          {copy[buttonState]}
        </motion.span>
      </AnimatePresence>
      <span role="status" aria-live="polite" className="sr-only">
        {buttonState === "loading"
          ? (loadingAnnouncement ??
            (typeof loadingLabel === "string" ? loadingLabel : "Loading"))
          : buttonState === "success"
            ? (successAnnouncement ??
              (typeof successLabel === "string" ? successLabel : "Done"))
            : ""}
      </span>
    </Button>
  );
}
