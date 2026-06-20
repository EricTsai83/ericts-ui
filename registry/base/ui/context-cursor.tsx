"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type SpringOptions,
} from "motion/react";

import { cn } from "@/lib/utils";

export type ContextCursorVariant = "default" | "open" | "drag" | "preview";
export type ContextCursorFollow = "instant" | "spring";

export type ContextCursorState = {
  label: React.ReactNode;
  icon?: React.ReactNode;
  variant?: ContextCursorVariant;
};

type ContextCursorContextValue = {
  showCursor: (cursor: ContextCursorState, targetId: string) => void;
  hideCursor: (targetId?: string) => void;
  isDisabled: boolean;
};

const ContextCursorContext =
  React.createContext<ContextCursorContextValue | null>(null);

const defaultSpring: SpringOptions = {
  mass: 0.12,
  stiffness: 320,
  damping: 26,
};

const variantClassNames: Record<ContextCursorVariant, string> = {
  default: "border-border bg-background text-foreground shadow-sm",
  open: "border-transparent bg-primary text-primary-foreground shadow-sm",
  drag: "border-border bg-muted text-foreground shadow-sm",
  preview: "border-border bg-background text-foreground shadow-sm",
};

export type ContextCursorProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "onPointerEnter" | "onPointerLeave" | "onPointerMove"
> & {
  follow?: ContextCursorFollow;
  spring?: SpringOptions;
  cursorClassName?: string;
  disabled?: boolean;
};

export function ContextCursor({
  children,
  className,
  cursorClassName,
  follow = "instant",
  spring = defaultSpring,
  disabled,
  ...props
}: ContextCursorProps) {
  const shouldReduceMotion = useReducedMotion();
  const supportsFinePointer = useFinePointer();
  const [cursor, setCursor] = React.useState<ContextCursorState | null>(null);
  const bounds = React.useRef<DOMRectReadOnly | null>(null);
  const hideTimer = React.useRef<number | null>(null);
  const activeTargetId = React.useRef<string | null>(null);
  const isDisabled = Boolean(
    disabled || shouldReduceMotion || !supportsFinePointer,
  );
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, spring);
  const springY = useSpring(rawY, spring);
  const x = follow === "spring" ? springX : rawX;
  const y = follow === "spring" ? springY : rawY;
  const isCursorVisible = Boolean(cursor && !isDisabled);

  const showCursor = React.useCallback(
    (nextCursor: ContextCursorState, targetId: string) => {
      if (isDisabled) return;

      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }

      activeTargetId.current = targetId;
      setCursor(nextCursor);
    },
    [isDisabled],
  );

  const hideCursor = React.useCallback(
    (targetId?: string) => {
      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }

      const targetIdAtLeave = targetId ?? activeTargetId.current;

      hideTimer.current = window.setTimeout(() => {
        if (targetIdAtLeave && activeTargetId.current !== targetIdAtLeave) {
          return;
        }

        activeTargetId.current = null;
        setCursor(null);
        hideTimer.current = null;
      }, 100);
    },
    [],
  );

  React.useEffect(() => {
    return () => {
      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!isDisabled) return;

    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    activeTargetId.current = null;
    bounds.current = null;
    hideTimer.current = window.setTimeout(() => {
      setCursor(null);
      hideTimer.current = null;
    }, 0);
  }, [isDisabled]);

  const updateBounds = React.useCallback((element: HTMLDivElement) => {
    bounds.current = element.getBoundingClientRect();
  }, []);

  const handlePointerEnter = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isDisabled || event.pointerType !== "mouse") return;

      updateBounds(event.currentTarget);
    },
    [isDisabled, updateBounds],
  );

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isDisabled || event.pointerType !== "mouse") return;

      const currentBounds =
        bounds.current ?? event.currentTarget.getBoundingClientRect();

      rawX.set(Math.round(event.clientX - currentBounds.left));
      rawY.set(Math.round(event.clientY - currentBounds.top));
    },
    [isDisabled, rawX, rawY],
  );

  const handlePointerLeave = React.useCallback(() => {
    bounds.current = null;
    hideCursor();
  }, [hideCursor]);

  const contextValue = React.useMemo<ContextCursorContextValue>(
    () => ({
      showCursor,
      hideCursor,
      isDisabled,
    }),
    [hideCursor, isDisabled, showCursor],
  );
  const variant = cursor?.variant ?? "default";

  return (
    <ContextCursorContext.Provider value={contextValue}>
      <div
        {...props}
        data-slot="context-cursor"
        className={cn("relative", className)}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {children}
        <motion.div
          aria-hidden="true"
          data-slot="context-cursor-indicator"
          style={{
            x,
            y,
          }}
          initial={false}
          animate={{
            opacity: isCursorVisible ? 1 : 0,
          }}
          transition={{
            duration: isCursorVisible ? 0.12 : 0.1,
            ease: [0.215, 0.61, 0.355, 1],
          }}
          className={cn(
            "pointer-events-none absolute left-0 top-0 z-20 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium leading-5 will-change-transform",
            variantClassNames[variant],
            !cursor && "invisible",
            cursorClassName,
          )}
        >
          {cursor?.icon ? (
            <span
              data-slot="context-cursor-icon"
              className="flex size-3.5 items-center justify-center"
            >
              {cursor.icon}
            </span>
          ) : null}
          {cursor?.label}
        </motion.div>
      </div>
    </ContextCursorContext.Provider>
  );
}

function useFinePointer() {
  const [supportsFinePointer, setSupportsFinePointer] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updateSupportsFinePointer = () => {
      setSupportsFinePointer(mediaQuery.matches);
    };

    updateSupportsFinePointer();
    mediaQuery.addEventListener("change", updateSupportsFinePointer);

    return () => {
      mediaQuery.removeEventListener("change", updateSupportsFinePointer);
    };
  }, []);

  return supportsFinePointer;
}

export type ContextCursorTargetProps =
  React.ComponentPropsWithoutRef<"div"> & {
    label: React.ReactNode;
    icon?: React.ReactNode;
    variant?: ContextCursorVariant;
  };

export function ContextCursorTarget({
  children,
  className,
  label,
  icon,
  variant = "default",
  onPointerEnter,
  onPointerLeave,
  ...props
}: ContextCursorTargetProps) {
  const context = React.useContext(ContextCursorContext);
  const targetId = React.useId();

  return (
    <div
      data-slot="context-cursor-target"
      className={cn(
        !context?.isDisabled && "cursor-none [&_*]:cursor-none",
        className,
      )}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") {
          context?.showCursor({ label, icon, variant }, targetId);
        }
        onPointerEnter?.(event);
      }}
      onPointerLeave={(event) => {
        context?.hideCursor(targetId);
        onPointerLeave?.(event);
      }}
      {...props}
    >
      {children}
    </div>
  );
}
