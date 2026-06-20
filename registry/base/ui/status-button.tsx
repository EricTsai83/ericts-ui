"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonProps = React.ComponentPropsWithoutRef<typeof Button>;
type ButtonClickEvent = Parameters<NonNullable<ButtonProps["onClick"]>>[0];
type ButtonState = "idle" | "loading" | "success";

export type StatusButtonProps = Omit<ButtonProps, "children" | "onClick"> & {
  idleLabel?: React.ReactNode;
  loadingLabel?: React.ReactNode;
  successLabel?: React.ReactNode;
  loadingAnnouncement?: string;
  successAnnouncement?: string;
  loadingDuration?: number;
  successDuration?: number;
  onClick?: (event: ButtonClickEvent) => void | Promise<void>;
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

function wait(duration: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

export function StatusButton({
  idleLabel = "Submit",
  loadingLabel = <Spinner />,
  successLabel = "Done",
  loadingAnnouncement = "Loading",
  successAnnouncement = "Complete",
  loadingDuration = 0,
  successDuration = 1500,
  disabled,
  className,
  onClick,
  type = "button",
  ...props
}: StatusButtonProps) {
  const [buttonState, setButtonState] = React.useState<ButtonState>("idle");
  const shouldReduceMotion = useReducedMotion();
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  React.useEffect(() => {
    return () => {
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

      try {
        const result = onClick?.(event);

        if (event.defaultPrevented) {
          setButtonState("idle");
          return;
        }

        await Promise.all([result, wait(loadingDuration)]);
      } catch {
        setButtonState("idle");
        return;
      }

      setButtonState("success");
      timers.current = [
        setTimeout(() => {
          setButtonState("idle");
        }, successDuration),
      ];
    },
    [buttonState, clearTimers, loadingDuration, onClick, successDuration]
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
      disabled={disabled || buttonState !== "idle"}
      aria-busy={buttonState === "loading"}
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
          ? loadingAnnouncement
          : buttonState === "success"
            ? successAnnouncement
            : ""}
      </span>
    </Button>
  );
}
