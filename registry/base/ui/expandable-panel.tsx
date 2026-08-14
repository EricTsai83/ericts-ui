"use client";

import { ChevronsUpDown } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import * as React from "react";

import { cn } from "@/lib/utils";

const PANEL_TRANSITION = {
  type: "spring",
  duration: 0.24,
  bounce: 0,
} as const;
const CONTENT_TRANSITION = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1],
} as const;
const REDUCED_TRANSITION = { duration: 0 } as const;
// Single source of truth for the panel's height cap. Applied to the content
// region so consumers can add a scroll area / pinned footer without knowing it.
const CONTENT_MAX_HEIGHT =
  "var(--expandable-panel-max-height, min(15.5rem, calc(100dvh - 8rem)))";

type ExpandablePanelContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const ExpandablePanelContext =
  React.createContext<ExpandablePanelContextValue | null>(null);

/**
 * Access the expanding panel's open state from within its `children`, e.g. to
 * collapse the panel after an action. Throws when used outside the component.
 */
export function useExpandablePanel() {
  const context = React.useContext(ExpandablePanelContext);

  if (!context) {
    throw new Error(
      "useExpandablePanel must be used within an <ExpandablePanel>.",
    );
  }

  return context;
}

export type ExpandablePanelClassNames = {
  panel?: string;
  content?: string;
  trigger?: string;
};

export type ExpandablePanelProps = Omit<
  React.ComponentProps<"aside">,
  "children"
> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerIcon?: React.ReactNode;
  openLabel?: string;
  closeLabel?: string;
  closeOnEscape?: boolean;
  /**
   * Collapse when a pointer goes down outside the panel. Content that portals
   * outside the panel's subtree (Select, Popover, Dialog) registers as
   * "outside"; set this to false and close manually in that case.
   */
  closeOnOutsideClick?: boolean;
  classNames?: ExpandablePanelClassNames;
  children?: React.ReactNode;
};

/**
 * A floating panel that grows in width and height from a compact icon trigger
 * in its top-right corner. It is intentionally content-agnostic.
 *
 * The panel is bounded by `--expandable-panel-width` and
 * `--expandable-panel-max-height` and clips overflow, so the morph never runs
 * off-screen. The content region is a flex column capped at that height, so
 * tall content can add a `flex-1` scroll area (and, e.g., a `shrink-0` pinned
 * footer) without re-declaring the cap.
 *
 * The trigger overlays the top-right corner; content that reaches it should
 * clear it with `pr-[var(--expandable-panel-trigger-inset)]` (defaults to the
 * 2rem trigger size).
 */
export function ExpandablePanel({
  open,
  defaultOpen = false,
  onOpenChange,
  triggerIcon,
  openLabel = "Expand",
  closeLabel = "Collapse",
  closeOnEscape = true,
  closeOnOutsideClick = true,
  className,
  classNames,
  children,
  "aria-label": ariaLabel = "Expanding panel",
  onKeyDown,
  ref,
  ...props
}: ExpandablePanelProps) {
  const generatedId = React.useId();
  const panelId = `${generatedId}-panel`;
  const rootRef = React.useRef<HTMLElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const openControlled = open !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isOpen = openControlled ? open : uncontrolledOpen;

  const panelTransition = shouldReduceMotion
    ? REDUCED_TRANSITION
    : PANEL_TRANSITION;
  const contentTransition = shouldReduceMotion
    ? REDUCED_TRANSITION
    : CONTENT_TRANSITION;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!openControlled) {
        setUncontrolledOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [onOpenChange, openControlled],
  );

  React.useEffect(() => {
    if (!isOpen || !closeOnOutsideClick) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const root = rootRef.current;

      if (
        !root ||
        !(event.target instanceof Node) ||
        // A target detached by the very interaction being handled (e.g. a
        // removed list row) can no longer prove it was outside the panel.
        !event.target.isConnected ||
        root.contains(event.target)
      ) {
        return;
      }

      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown, true);

    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [closeOnOutsideClick, isOpen, setOpen]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      onKeyDown?.(event);

      if (
        event.defaultPrevented ||
        !closeOnEscape ||
        !isOpen ||
        event.key !== "Escape"
      ) {
        return;
      }

      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    },
    [closeOnEscape, isOpen, onKeyDown, setOpen],
  );

  const contextValue = React.useMemo<ExpandablePanelContextValue>(
    () => ({ open: isOpen, setOpen }),
    [isOpen, setOpen],
  );

  // The root node is needed internally (outside-click detection) *and* by
  // consumers, so the consumer's ref is merged in rather than overwritten.
  const setRootRef = React.useCallback(
    (node: HTMLElement | null) => {
      rootRef.current = node;

      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  return (
    <ExpandablePanelContext.Provider value={contextValue}>
      <aside
        ref={setRootRef}
        aria-label={ariaLabel}
        data-slot="expandable-panel"
        data-state={isOpen ? "open" : "closed"}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative inline-flex max-w-[calc(100vw-1.5rem)] justify-end",
          className,
        )}
        {...props}
      >
        <div className="relative flex justify-end">
          <motion.div
            id={panelId}
            initial={false}
            animate={isOpen ? { height: "auto" } : { height: "2rem" }}
            transition={panelTransition}
            style={{ transformOrigin: "top right" }}
            className={cn(
              "relative overflow-hidden rounded-lg border border-border/70 bg-popover/90 text-popover-foreground shadow-md backdrop-blur-lg transition-[width] duration-240 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-[width,height] motion-reduce:transition-none",
              isOpen
                ? "w-[min(var(--expandable-panel-width,17rem),calc(100vw-1.5rem))]"
                : "size-8",
              classNames?.panel,
            )}
          >
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  key="expandable-panel-content"
                  initial={
                    shouldReduceMotion
                      ? false
                      : { opacity: 0, scale: 0.99, filter: "blur(1.5px)" }
                  }
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.98 }
                  }
                  transition={contentTransition}
                  style={{
                    transformOrigin: "top right",
                    maxHeight: CONTENT_MAX_HEIGHT,
                  }}
                  className={cn(
                    "flex flex-col [--expandable-panel-trigger-inset:2rem] will-change-[filter,transform,opacity]",
                    classNames?.content,
                  )}
                >
                  {children}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>

          <button
            ref={triggerRef}
            type="button"
            aria-controls={panelId}
            aria-expanded={isOpen}
            aria-label={isOpen ? closeLabel : openLabel}
            onClick={() => setOpen(!isOpen)}
            className={cn(
              "extend-touch-target absolute right-0 top-0 z-10 flex size-8 items-center justify-center rounded-md text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none",
              classNames?.trigger,
            )}
          >
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-md bg-transparent text-current"
            >
              {triggerIcon ?? <ChevronsUpDown className="size-3.5" />}
            </span>
          </button>
        </div>
      </aside>
    </ExpandablePanelContext.Provider>
  );
}
