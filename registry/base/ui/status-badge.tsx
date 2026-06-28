"use client";

import {
  AlertTriangle,
  Check,
  Circle,
  Info,
  LoaderCircle,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StatusBadgeStatus =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "loading";

export type StatusBadgeSize = "sm" | "md";

export interface StatusBadgeProps
  extends Omit<HTMLMotionProps<"span">, "children"> {
  status?: StatusBadgeStatus;
  size?: StatusBadgeSize;
  children?: ReactNode;
  icon?: ReactNode;
  showIcon?: boolean;
  pulse?: boolean;
  contentKey?: string | number;
}

const EASE = [0.4, 0, 0.2, 1] as const;
const SPRING_LAYOUT = {
  type: "spring",
  stiffness: 420,
  damping: 38,
  mass: 0.7,
} as const;
const CONTENT_TRANSITION = {
  type: "spring",
  duration: 0.3,
  bounce: 0,
} as const;

const statusClassNames: Record<StatusBadgeStatus, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  info: "border-primary/25 bg-primary/10 text-primary",
  success:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning:
    "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  danger: "border-destructive/25 bg-destructive/10 text-destructive",
  loading: "border-primary/25 bg-primary/10 text-primary",
};

const sizeClassNames: Record<StatusBadgeSize, string> = {
  sm: "h-6 gap-1.5 px-2 text-[11px]",
  md: "h-8 gap-2 px-3 text-xs",
};

const iconClassNames: Record<StatusBadgeSize, string> = {
  sm: "size-3",
  md: "size-3.5",
};

const statusIcons: Record<StatusBadgeStatus, LucideIcon> = {
  neutral: Circle,
  info: Info,
  success: Check,
  warning: AlertTriangle,
  danger: X,
  loading: LoaderCircle,
};

const iconVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.96,
    rotateX: -35,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      y: CONTENT_TRANSITION,
      scale: CONTENT_TRANSITION,
      rotateX: CONTENT_TRANSITION,
      opacity: CONTENT_TRANSITION,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.96,
    rotateX: 35,
    transition: {
      y: CONTENT_TRANSITION,
      scale: CONTENT_TRANSITION,
      rotateX: CONTENT_TRANSITION,
      opacity: CONTENT_TRANSITION,
    },
  },
};

const labelVariants: Variants = {
  initial: { opacity: 0, y: 12, rotateX: -35 },
  animate: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      y: CONTENT_TRANSITION,
      rotateX: CONTENT_TRANSITION,
      opacity: CONTENT_TRANSITION,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    rotateX: 35,
    transition: {
      y: CONTENT_TRANSITION,
      rotateX: CONTENT_TRANSITION,
      opacity: CONTENT_TRANSITION,
    },
  },
};

export function StatusBadge({
  status = "neutral",
  size = "md",
  children,
  icon,
  showIcon = true,
  pulse = status === "loading",
  contentKey,
  className,
  ...props
}: StatusBadgeProps) {
  const shouldReduceMotion = useReducedMotion();
  const Icon = statusIcons[status];
  const resolvedContentKey =
    contentKey ??
    (typeof children === "string" || typeof children === "number"
      ? children
      : status);

  return (
    <motion.span
      layout
      data-slot="status-badge"
      transition={shouldReduceMotion ? { duration: 0 } : SPRING_LAYOUT}
      className={cn(
        "relative inline-flex shrink-0 items-center overflow-hidden whitespace-nowrap rounded-full border font-medium tabular-nums",
        "transition-colors duration-150 ease-out",
        statusClassNames[status],
        sizeClassNames[size],
        className
      )}
      {...props}
    >
      {pulse && !shouldReduceMotion ? (
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-current"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ scale: [0.98, 1.04, 0.98], opacity: [0.04, 0.12, 0.04] }}
          exit={{ opacity: 0, transition: { duration: 0.12, ease: EASE } }}
          transition={{ duration: 1.8, repeat: Infinity, ease: EASE }}
        />
      ) : null}

      {showIcon ? (
        <span
          data-slot="status-badge-icon-wrap"
          className="relative z-10 inline-flex items-center justify-center overflow-hidden"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={status}
              aria-hidden="true"
              data-slot="status-badge-icon"
              variants={iconVariants}
              initial={shouldReduceMotion ? false : "initial"}
              animate={shouldReduceMotion ? { opacity: 1 } : "animate"}
              exit={shouldReduceMotion ? undefined : "exit"}
              className="inline-flex [transform-origin:50%_65%] [transform-style:preserve-3d] will-change-transform"
            >
              {status === "loading" && !shouldReduceMotion && !icon ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                  className="inline-flex"
                >
                  <Icon className={iconClassNames[size]} />
                </motion.span>
              ) : (
                (icon ?? <Icon className={iconClassNames[size]} />)
              )}
            </motion.span>
          </AnimatePresence>
        </span>
      ) : null}

      {children != null ? (
        <span
          data-slot="status-badge-label-wrap"
          className="relative z-10 inline-flex overflow-hidden"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={resolvedContentKey}
              data-slot="status-badge-label"
              variants={labelVariants}
              initial={shouldReduceMotion ? false : "initial"}
              animate={shouldReduceMotion ? { opacity: 1 } : "animate"}
              exit={shouldReduceMotion ? undefined : "exit"}
              className="inline-block [transform-origin:50%_65%] [transform-style:preserve-3d] will-change-transform"
            >
              {children}
            </motion.span>
          </AnimatePresence>
        </span>
      ) : null}
    </motion.span>
  );
}
