"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FeedbackState = "idle" | "loading" | "success";

const INSTANT_TRANSITION = { duration: 0 } as const;
const CONTENT_TRANSITION = {
  type: "spring",
  duration: 0.4,
  bounce: 0,
} as const;
const SUBMIT_TRANSITION = {
  type: "spring",
  duration: 0.3,
  bounce: 0,
} as const;
// Stable dependencies skip layout measurement while typing. Keeping the two
// values different still lets Motion promote between the shared elements.
const TRIGGER_LAYOUT_DEPENDENCY = "trigger";
const POPOVER_LAYOUT_DEPENDENCY = "popover";

export type FeedbackPopoverProps = Omit<
  React.ComponentProps<"div">,
  "children" | "onSubmit"
> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (feedback: string) => void | Promise<void>;
  /**
   * Called when `onSubmit` rejects. Without this the form silently returns to
   * idle with the draft intact and no way to surface the failure.
   */
  onError?: (error: unknown) => void;
  triggerLabel?: React.ReactNode;
  /**
   * Doubles as the placeholder: it floats over the empty textarea and clears
   * once there is text, so there is no separate `placeholder` prop.
   */
  textareaLabel?: string;
  submitLabel?: React.ReactNode;
  successTitle?: React.ReactNode;
  successDescription?: React.ReactNode;
  loadingAnnouncement?: string;
  /**
   * Minimum time in ms the loading state stays visible, so quick submissions
   * don't flash. Slow ones keep loading until `onSubmit` settles.
   */
  loadingDuration?: number;
  /** Time in ms the success screen stays visible before the popover closes. */
  successDuration?: number;
};

function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70 motion-reduce:animate-none",
        className,
      )}
    />
  );
}

function wait(duration: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

export function FeedbackPopover({
  open,
  defaultOpen = false,
  onOpenChange,
  onSubmit,
  onError,
  triggerLabel = "Feedback",
  textareaLabel = "Feedback",
  submitLabel = "Send feedback",
  successTitle = "Feedback received!",
  successDescription = "Thanks for helping us improve.",
  loadingAnnouncement = "Sending feedback",
  loadingDuration = 1500,
  successDuration = 1800,
  className,
  ...props
}: FeedbackPopoverProps) {
  const reactId = React.useId();
  const titleId = `${reactId}-title`;
  const descriptionId = `${reactId}-description`;
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const timers = React.useRef<number[]>([]);
  const isMountedRef = React.useRef(true);
  const shouldReduceMotion = useReducedMotion();
  const isControlled = open !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const [feedback, setFeedback] = React.useState("");
  const [formState, setFormState] = React.useState<FeedbackState>("idle");
  const isOpen = isControlled ? open : uncontrolledOpen;
  const trimmedFeedback = feedback.trim();

  const clearTimers = React.useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  }, []);

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  const closePopover = React.useCallback(
    (options?: { restoreFocus?: boolean }) => {
      clearTimers();
      setOpen(false);

      // Keyboard and programmatic closes return focus to the trigger so the
      // user isn't dropped on <body>; pointer dismissals leave focus where
      // the user clicked.
      if (options?.restoreFocus) {
        triggerRef.current?.focus();
      }
    },
    [clearTimers, setOpen],
  );

  const openPopover = React.useCallback(() => {
    clearTimers();
    setFormState("idle");
    setFeedback("");
    setOpen(true);
  }, [clearTimers, setOpen]);

  // Controlled parents can flip `open` without going through `openPopover`;
  // reset on the closed -> open transition so a reopen never shows the
  // previous session's stale draft or success screen.
  const wasOpenRef = React.useRef(isOpen);

  React.useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;

    if (isOpen && !wasOpen) {
      clearTimers();
      setFormState("idle");
      setFeedback("");
    }
  }, [clearTimers, isOpen]);

  const submitFeedback = React.useCallback(async () => {
    if (!trimmedFeedback || formState !== "idle") return;

    clearTimers();
    setFormState("loading");

    try {
      await Promise.all([onSubmit?.(trimmedFeedback), wait(loadingDuration)]);
    } catch (error) {
      if (!isMountedRef.current) return;
      setFormState("idle");
      onError?.(error);
      return;
    }

    if (!isMountedRef.current) return;

    setFormState("success");
    timers.current = [
      window.setTimeout(() => {
        setOpen(false);
        triggerRef.current?.focus();
      }, successDuration),
    ];
  }, [
    clearTimers,
    formState,
    loadingDuration,
    onError,
    onSubmit,
    setOpen,
    successDuration,
    trimmedFeedback,
  ]);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimers();
    };
  }, [clearTimers]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const popover = popoverRef.current;

      if (!popover || popover.contains(event.target as Node)) return;

      closePopover();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [closePopover, isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePopover({ restoreFocus: true });
        return;
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "Enter" &&
        formState === "idle" &&
        // Only submit when focus is inside the popover, so Cmd/Ctrl+Enter in
        // some other form on the page doesn't send this one.
        popoverRef.current?.contains(document.activeElement)
      ) {
        event.preventDefault();
        void submitFeedback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePopover, formState, isOpen, submitFeedback]);

  // Match the reference: the popover morph uses Motion's default layout transition
  // (tween, 0.45s, ease [0.4, 0, 0.1, 1]) by leaving `transition` undefined.
  const layoutTransition = shouldReduceMotion ? INSTANT_TRANSITION : undefined;
  const contentTransition = shouldReduceMotion
    ? INSTANT_TRANSITION
    : CONTENT_TRANSITION;
  const submitTransition = shouldReduceMotion
    ? INSTANT_TRANSITION
    : SUBMIT_TRANSITION;

  return (
    <div
      data-slot="feedback-popover"
      className={cn(
        "relative inline-flex max-w-full [--feedback-popover-width:min(22rem,calc(100vw-2rem))]",
        className,
      )}
      {...props}
    >
      <LayoutGroup id={reactId}>
        <motion.button
          ref={triggerRef}
          type="button"
          layoutId="feedback-popover-wrapper"
          layoutDependency={TRIGGER_LAYOUT_DEPENDENCY}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={isOpen ? reactId : undefined}
          onClick={openPopover}
          transition={layoutTransition}
          style={{ borderRadius: 8 }}
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "relative overflow-hidden transition-colors motion-reduce:transition-none",
          )}
        >
          <motion.span
            layoutId="feedback-popover-title"
            layoutDependency={TRIGGER_LAYOUT_DEPENDENCY}
            transition={layoutTransition}
            className="leading-6"
          >
            {triggerLabel}
          </motion.span>
        </motion.button>

        <AnimatePresence>
          {isOpen ? (
            <motion.div
              key="popover"
              id={reactId}
              ref={popoverRef}
              layoutId="feedback-popover-wrapper"
              layoutDependency={POPOVER_LAYOUT_DEPENDENCY}
              role="dialog"
              aria-labelledby={titleId}
              aria-describedby={
                formState === "success" ? descriptionId : undefined
              }
              transition={layoutTransition}
              style={{ borderRadius: 12 }}
              className="absolute left-1/2 top-1/2 z-50 h-48 w-(--feedback-popover-width) -translate-x-1/2 -translate-y-1/2 overflow-hidden border bg-background text-foreground shadow-sm"
            >
              <motion.span
                id={titleId}
                layoutId="feedback-popover-title"
                layoutDependency={POPOVER_LAYOUT_DEPENDENCY}
                transition={layoutTransition}
                data-state={formState}
                data-has-feedback={feedback ? "true" : "false"}
                className="pointer-events-none absolute left-3 top-3 text-sm font-medium leading-6 text-muted-foreground data-[has-feedback=true]:opacity-0! data-[state=success]:opacity-0!"
              >
                {textareaLabel}
              </motion.span>

              <AnimatePresence mode="popLayout" initial={false}>
                {formState === "success" ? (
                  <motion.div
                    key="success"
                    initial={
                      shouldReduceMotion
                        ? false
                        : {
                            opacity: 0,
                            transform: "translateY(-32px)",
                            filter: "blur(4px)",
                          }
                    }
                    animate={{
                      opacity: 1,
                      transform: "translateY(0px)",
                      filter: "blur(0px)",
                    }}
                    exit={
                      shouldReduceMotion
                        ? undefined
                        : {
                            opacity: 0,
                            transform: "translateY(8px)",
                            filter: "blur(4px)",
                          }
                    }
                    transition={contentTransition}
                    className="flex h-full flex-col items-center justify-center gap-3 px-8 py-8 text-center"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary"
                    >
                      <CheckCircle2 className="size-6" />
                    </span>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-base font-semibold">
                        {successTitle}
                      </h3>
                      <p
                        id={descriptionId}
                        className="text-sm leading-5 text-muted-foreground"
                      >
                        {successDescription}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    exit={
                      shouldReduceMotion
                        ? undefined
                        : {
                            opacity: 0,
                            transform: "translateY(8px)",
                            filter: "blur(4px)",
                          }
                    }
                    transition={contentTransition}
                    onSubmit={(event) => {
                      event.preventDefault();
                      void submitFeedback();
                    }}
                    className="flex h-full flex-col"
                  >
                    <label htmlFor={`${reactId}-textarea`} className="sr-only">
                      {textareaLabel}
                    </label>
                    <textarea
                      id={`${reactId}-textarea`}
                      autoFocus
                      required
                      value={feedback}
                      disabled={formState === "loading"}
                      onChange={(event) => setFeedback(event.target.value)}
                      className="min-h-0 flex-1 resize-none bg-transparent px-3 pb-3 pt-3 text-sm leading-6 outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <div className="relative flex items-center justify-end border-t border-dashed bg-muted/30 px-3 py-2.5">
                      <span
                        aria-hidden="true"
                        className="absolute -left-px top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-background"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute -right-px top-1/2 size-3 -translate-y-1/2 translate-x-1/2 rounded-full border bg-background"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!trimmedFeedback || formState === "loading"}
                        className="min-w-32 overflow-hidden"
                      >
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.span
                            key={formState}
                            initial={
                              shouldReduceMotion
                                ? false
                                : {
                                    opacity: 0,
                                    transform: "translateY(-25px)",
                                  }
                            }
                            animate={{
                              opacity: 1,
                              transform: "translateY(0px)",
                            }}
                            exit={
                              shouldReduceMotion
                                ? undefined
                                : {
                                    opacity: 0,
                                    transform: "translateY(25px)",
                                  }
                            }
                            transition={submitTransition}
                            className="inline-flex items-center justify-center gap-1.5"
                          >
                            {formState === "loading" ? (
                              <>
                                <Spinner />
                                <span className="sr-only">
                                  {loadingAnnouncement}
                                </span>
                              </>
                            ) : (
                              <span>{submitLabel}</span>
                            )}
                          </motion.span>
                        </AnimatePresence>
                      </Button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}
