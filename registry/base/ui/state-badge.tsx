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

export type StateBadgeStatus =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "loading";

export type StateBadgeSize = "sm" | "md";

export interface StateBadgeProps
  extends Omit<HTMLMotionProps<"span">, "children"> {
  status?: StateBadgeStatus;
  size?: StateBadgeSize;
  children?: ReactNode;
  icon?: ReactNode;
  showIcon?: boolean;
  pulse?: boolean;
  contentKey?: string | number;
}

const EASE = [0.4, 0, 0.2, 1] as const;
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const SPRING_LAYOUT = {
  type: "spring",
  stiffness: 420,
  damping: 38,
  mass: 0.7,
} as const;
const CONTENT_TRANSITION = {
  duration: 0.2,
  ease: EASE_OUT,
} as const;
const CONTENT_EXIT_TRANSITION = { duration: 0.1, ease: EASE_OUT } as const;

const statusClassNames: Record<StateBadgeStatus, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  info: "border-primary/25 bg-primary/10 text-primary",
  success:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning:
    "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  danger: "border-destructive/25 bg-destructive/10 text-destructive",
  loading: "border-primary/25 bg-primary/10 text-primary",
};

const sizeClassNames: Record<StateBadgeSize, string> = {
  sm: "h-6 gap-1.5 px-2 text-[11px]",
  md: "h-8 gap-2 px-3 text-xs",
};

const iconClassNames: Record<StateBadgeSize, string> = {
  sm: "size-3",
  md: "size-3.5",
};

const statusIcons: Record<StateBadgeStatus, LucideIcon> = {
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
    y: 4,
    scale: 0.98,
    filter: "blur(2px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      y: CONTENT_TRANSITION,
      scale: CONTENT_TRANSITION,
      filter: CONTENT_TRANSITION,
      opacity: { duration: 0.14, ease: EASE_OUT },
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.98,
    filter: "blur(2px)",
    transition: {
      y: CONTENT_EXIT_TRANSITION,
      scale: CONTENT_EXIT_TRANSITION,
      filter: CONTENT_EXIT_TRANSITION,
      opacity: CONTENT_EXIT_TRANSITION,
    },
  },
};

const labelVariants: Variants = {
  initial: { opacity: 0, y: 4, filter: "blur(2px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      y: CONTENT_TRANSITION,
      filter: CONTENT_TRANSITION,
      opacity: { duration: 0.14, ease: EASE_OUT },
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    filter: "blur(2px)",
    transition: {
      y: CONTENT_EXIT_TRANSITION,
      filter: CONTENT_EXIT_TRANSITION,
      opacity: CONTENT_EXIT_TRANSITION,
    },
  },
};

export function StateBadge({
  status = "neutral",
  size = "md",
  children,
  icon,
  showIcon = true,
  pulse = status === "loading",
  contentKey,
  className,
  ...props
}: StateBadgeProps) {
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
      data-slot="state-badge"
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
          data-slot="state-badge-icon-wrap"
          className="relative z-10 inline-flex items-center justify-center overflow-hidden"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={status}
              aria-hidden="true"
              data-slot="state-badge-icon"
              variants={iconVariants}
              initial={shouldReduceMotion ? false : "initial"}
              animate={shouldReduceMotion ? { opacity: 1 } : "animate"}
              exit={shouldReduceMotion ? undefined : "exit"}
              className="inline-flex will-change-[filter,transform,opacity]"
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
          data-slot="state-badge-label-wrap"
          className="relative z-10 inline-flex overflow-hidden"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={resolvedContentKey}
              data-slot="state-badge-label"
              variants={labelVariants}
              initial={shouldReduceMotion ? false : "initial"}
              animate={shouldReduceMotion ? { opacity: 1 } : "animate"}
              exit={shouldReduceMotion ? undefined : "exit"}
              className="inline-block will-change-[filter,transform,opacity]"
            >
              {children}
            </motion.span>
          </AnimatePresence>
        </span>
      ) : null}
    </motion.span>
  );
}
