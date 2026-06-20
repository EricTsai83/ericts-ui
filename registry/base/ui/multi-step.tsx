"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MotionTransition = NonNullable<HTMLMotionProps<"div">["transition"]>;
type StepDirection = -1 | 1;

export type MultiStepItem = {
  id: string;
  content: React.ReactNode;
};

export type MultiStepProps = Omit<
  HTMLMotionProps<"div">,
  "animate" | "children" | "defaultValue" | "initial" | "onChange" | "transition"
> & {
  steps: MultiStepItem[];
  currentStep?: number;
  defaultStep?: number;
  onStepChange?: (step: number) => void;
  backLabel?: React.ReactNode;
  continueLabel?: React.ReactNode;
  completeLabel?: React.ReactNode;
  disableBack?: boolean;
  disableContinue?: boolean;
  footer?: React.ReactNode;
  contentClassName?: string;
  innerClassName?: string;
  actionsClassName?: string;
  transition?: MotionTransition;
};

export function MultiStep({
  steps,
  currentStep,
  defaultStep = 0,
  onStepChange,
  backLabel = "Back",
  continueLabel = "Continue",
  completeLabel = "Done",
  disableBack,
  disableContinue,
  footer,
  className,
  contentClassName,
  innerClassName,
  actionsClassName,
  transition,
  ...props
}: MultiStepProps) {
  const [uncontrolledStep, setUncontrolledStep] = React.useState(defaultStep);
  const [direction, setDirection] = React.useState<StepDirection>(1);
  const [height, setHeight] = React.useState<number | null>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const selectedStep = clampStep(
    currentStep ?? uncontrolledStep,
    steps.length
  );
  const isControlled = currentStep !== undefined;
  const isFirstStep = selectedStep === 0;
  const isLastStep = selectedStep === steps.length - 1;
  const activeStep = steps[selectedStep];

  React.useEffect(() => {
    const element = innerRef.current;

    if (!element) return;

    const updateHeight = (nextHeight: number) => {
      setHeight((currentHeight) => {
        if (currentHeight === null) return nextHeight;

        return Math.abs(currentHeight - nextHeight) > 0.5
          ? nextHeight
          : currentHeight;
      });
    };

    updateHeight(element.getBoundingClientRect().height);

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) return;

      const borderBoxSize = Array.isArray(entry.borderBoxSize)
        ? entry.borderBoxSize[0]
        : entry.borderBoxSize;

      updateHeight(
        borderBoxSize?.blockSize ?? entry.target.getBoundingClientRect().height
      );
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const setStep = React.useCallback(
    (nextStep: number, nextDirection: StepDirection) => {
      const resolvedStep = clampStep(nextStep, steps.length);

      setDirection(nextDirection);

      if (!isControlled) {
        setUncontrolledStep(resolvedStep);
      }

      onStepChange?.(resolvedStep);
    },
    [isControlled, onStepChange, steps.length]
  );

  const resolvedTransition: MotionTransition = shouldReduceMotion
    ? { duration: 0 }
    : transition ?? { type: "spring", duration: 0.5, bounce: 0 };
  const contentVariants = shouldReduceMotion
    ? reducedMotionStepVariants
    : stepVariants;

  if (!activeStep) {
    return null;
  }

  return (
    <MotionConfig reducedMotion="user" transition={resolvedTransition}>
      <motion.div
        {...props}
        data-slot="multi-step"
        initial={false}
        animate={
          shouldReduceMotion ? { height: "auto" } : { height: height ?? "auto" }
        }
        className={cn("overflow-hidden rounded-lg border bg-background", className)}
      >
        <div
          ref={innerRef}
          data-slot="multi-step-inner"
          className={cn("flex flex-col", innerClassName)}
        >
          <div
            data-slot="multi-step-viewport"
            className="relative overflow-hidden"
          >
            <AnimatePresence
              mode={shouldReduceMotion ? "sync" : "popLayout"}
              initial={false}
              custom={direction}
            >
              <motion.div
                key={activeStep.id}
                data-slot="multi-step-content"
                custom={direction}
                variants={contentVariants}
                initial="initial"
                animate="active"
                exit="exit"
                className={cn("w-full p-4", contentClassName)}
              >
                {activeStep.content}
              </motion.div>
            </AnimatePresence>
          </div>
          {footer ?? (
            <motion.div
              layout={!shouldReduceMotion}
              data-slot="multi-step-actions"
              className={cn(
                "flex items-center justify-between gap-3 border-t p-4",
                actionsClassName
              )}
            >
              <Button
                type="button"
                variant="outline"
                disabled={disableBack || isFirstStep}
                onClick={() => setStep(selectedStep - 1, -1)}
              >
                {backLabel}
              </Button>
              <Button
                type="button"
                disabled={disableContinue || isLastStep}
                onClick={() => setStep(selectedStep + 1, 1)}
              >
                {isLastStep ? completeLabel : continueLabel}
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </MotionConfig>
  );
}

const stepVariants = {
  initial: (direction: StepDirection) => ({
    x: `${110 * direction}%`,
    opacity: 0,
  }),
  active: { x: "0%", opacity: 1 },
  exit: (direction: StepDirection) => ({
    x: `${-110 * direction}%`,
    opacity: 0,
  }),
};

const reducedMotionStepVariants = {
  initial: { opacity: 0 },
  active: { opacity: 1 },
  exit: { opacity: 0 },
};

function clampStep(step: number, stepCount: number) {
  if (stepCount <= 0) return 0;

  return Math.min(Math.max(step, 0), stepCount - 1);
}
