"use client";

import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const DEFAULT_CONTENT_MAX_WIDTH = "min(32rem, calc(100vw - 2rem))";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const TOOLBAR_TRANSITION = {
  width: { duration: 0.2, ease: EASE_OUT },
  opacity: { duration: 0.14, ease: EASE_OUT },
} as const;
const TRIGGER_SURFACE_TRANSITION = { duration: 0.18, ease: EASE_OUT } as const;
const TOOLBAR_PADDING = 2;
const TRIGGER_RADIUS_OPEN = 8;
const TRIGGER_RADIUS_CLOSED = TRIGGER_RADIUS_OPEN + TOOLBAR_PADDING;

type ExpandableToolbarSide = "start" | "end";
type ExpandableToolbarAnchor = "toolbar" | "trigger";
type ExpandableToolbarTriggerProps = ComponentPropsWithoutRef<"button"> & {
  "data-state": "open" | "closed";
};

export type ExpandableToolbarClassNames = {
  triggerWrapper?: string;
  trigger?: string;
  triggerSeparator?: string;
  panel?: string;
  content?: string;
};

export type ExpandableToolbarTriggerRenderProps = {
  open: boolean;
  disabled: boolean;
  label: string;
  controlsId: string;
  triggerProps: ExpandableToolbarTriggerProps;
};

type ExpandableToolbarBaseProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "children" | "defaultValue" | "onChange"
> & {
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state for uncontrolled usage. */
  defaultOpen?: boolean;
  /** Called whenever the toolbar requests an open-state change. */
  onOpenChange?: (open: boolean) => void;
  /** Which side of the trigger the content should expand into. */
  side?: ExpandableToolbarSide;
  /** Whether the full toolbar or only the trigger participates in layout. */
  anchor?: ExpandableToolbarAnchor;
  expandLabel?: string;
  collapseLabel?: string;
  controlsId?: string;
  disabled?: boolean;
  /** Close the toolbar when Escape is pressed inside it. */
  closeOnEscape?: boolean;
  contentMaxWidth?: CSSProperties["maxWidth"];
  classNames?: ExpandableToolbarClassNames;
  children: ReactNode;
};

type ExpandableToolbarDefaultTriggerProps = {
  /** Icon used by the default trigger when the toolbar is closed. */
  expandIcon: ReactNode;
  /** Icon used by the default trigger when the toolbar is open. */
  collapseIcon?: ReactNode;
  renderTrigger?: never;
};

type ExpandableToolbarCustomTriggerProps = {
  expandIcon?: ReactNode;
  collapseIcon?: ReactNode;
  /**
   * Replace the default icon button trigger while keeping the measured panel,
   * ARIA attributes, and open-state plumbing.
   */
  renderTrigger: (props: ExpandableToolbarTriggerRenderProps) => ReactNode;
};

export type ExpandableToolbarProps = ExpandableToolbarBaseProps &
  (ExpandableToolbarDefaultTriggerProps | ExpandableToolbarCustomTriggerProps);

export function ExpandableToolbar({
  open,
  defaultOpen = false,
  onOpenChange,
  side = "start",
  anchor = "toolbar",
  expandIcon,
  collapseIcon,
  expandLabel = "Expand toolbar",
  collapseLabel = "Collapse toolbar",
  controlsId,
  disabled = false,
  closeOnEscape = true,
  contentMaxWidth = DEFAULT_CONTENT_MAX_WIDTH,
  className,
  classNames,
  renderTrigger,
  children,
  role,
  "aria-label": ariaLabel = "Expandable toolbar",
  onKeyDown,
  style,
  ...props
}: ExpandableToolbarProps) {
  const generatedId = useId();
  const panelId = controlsId ?? `${generatedId}-panel`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const triggerWrapperRef = useRef<HTMLDivElement>(null);
  const [contentRef, contentWidth] = useMeasuredWidth<HTMLDivElement>();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const shouldReduceMotion = useReducedMotion();
  const controlled = open !== undefined;
  const isOpen = controlled ? open : internalOpen;
  const panelWidth = isOpen ? contentWidth : 0;
  const currentLabel = isOpen ? collapseLabel : expandLabel;

  const focusTrigger = useCallback(() => {
    const trigger =
      triggerRef.current ?? getFirstFocusableElement(triggerWrapperRef.current);

    trigger?.focus();
  }, []);

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (disabled) return;

      if (!controlled) {
        setInternalOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [controlled, disabled, onOpenChange],
  );

  const toggleOpen = useCallback(() => {
    setOpen(!isOpen);
  }, [isOpen, setOpen]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
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
      focusTrigger();
    },
    [closeOnEscape, focusTrigger, isOpen, onKeyDown, setOpen],
  );

  const triggerRadius = isOpen ? TRIGGER_RADIUS_OPEN : TRIGGER_RADIUS_CLOSED;
  const triggerTransition = shouldReduceMotion
    ? { duration: 0 }
    : TRIGGER_SURFACE_TRANSITION;
  const transition = shouldReduceMotion ? { duration: 0 } : TOOLBAR_TRANSITION;
  const triggerProps = {
    type: "button",
    disabled,
    "aria-label": currentLabel,
    "aria-expanded": isOpen,
    "aria-controls": panelId,
    "data-state": isOpen ? "open" : "closed",
    className: classNames?.trigger,
    onClick: toggleOpen,
  } satisfies ExpandableToolbarTriggerProps;

  const trigger = (
    <motion.div
      ref={triggerWrapperRef}
      data-slot="expandable-toolbar-trigger-wrapper"
      data-state={isOpen ? "open" : "closed"}
      className={cn(
        "group/expandable-toolbar-trigger relative isolate flex size-8 shrink-0 items-center justify-center",
        classNames?.triggerWrapper,
      )}
    >
      {!renderTrigger ? (
        <motion.span
          aria-hidden="true"
          data-slot="expandable-toolbar-trigger-surface"
          initial={false}
          animate={{
            inset: isOpen ? 0 : -TOOLBAR_PADDING,
            borderRadius: triggerRadius,
          }}
          transition={triggerTransition}
          className={cn(
            "pointer-events-none absolute z-0 bg-muted opacity-0 transition-opacity",
            "group-hover/expandable-toolbar-trigger:opacity-100 group-data-[state=open]/expandable-toolbar-trigger:opacity-100",
            "dark:bg-muted/50",
            disabled && "hidden",
          )}
        />
      ) : null}
      {renderTrigger ? (
        renderTrigger({
          open: isOpen,
          disabled,
          label: currentLabel,
          controlsId: panelId,
          triggerProps,
        })
      ) : (
        <DefaultExpandableToolbarTrigger
          open={isOpen}
          expandIcon={expandIcon}
          collapseIcon={collapseIcon}
          triggerProps={triggerProps}
        />
      )}
    </motion.div>
  );

  const panel = (
    <motion.div
      initial={false}
      id={panelId}
      aria-hidden={!isOpen}
      inert={!isOpen ? true : undefined}
      data-slot="expandable-toolbar-panel"
      data-state={isOpen ? "open" : "closed"}
      animate={{ width: panelWidth, opacity: isOpen ? 1 : 0 }}
      transition={transition}
      className={cn(
        "flex min-w-0 overflow-hidden whitespace-nowrap",
        side === "start" ? "justify-end" : "justify-start",
        !isOpen && "pointer-events-none",
        classNames?.panel,
      )}
      style={{ maxWidth: contentMaxWidth }}
    >
      <div
        ref={contentRef}
        data-slot="expandable-toolbar-content"
        className={cn(
          "flex w-max shrink-0 flex-nowrap items-center gap-1",
          classNames?.content,
        )}
      >
        {side === "end" ? (
          <span
            aria-hidden="true"
            data-slot="expandable-toolbar-trigger-separator"
            className={cn(
              "mx-1 h-5 w-px shrink-0 bg-border",
              classNames?.triggerSeparator,
            )}
          />
        ) : null}
        {children}
        {side === "start" ? (
          <span
            aria-hidden="true"
            data-slot="expandable-toolbar-trigger-separator"
            className={cn(
              "mx-1 h-5 w-px shrink-0 bg-border",
              classNames?.triggerSeparator,
            )}
          />
        ) : null}
      </div>
    </motion.div>
  );

  const toolbar = (
    <div
      role={role ?? "toolbar"}
      aria-label={ariaLabel}
      data-slot="expandable-toolbar"
      data-state={isOpen ? "open" : "closed"}
      data-side={side}
      className={cn(
        "inline-flex max-w-full items-center overflow-hidden rounded-lg border bg-background text-foreground shadow-sm",
        className,
      )}
      onKeyDown={handleKeyDown}
      style={{ ...style, padding: TOOLBAR_PADDING }}
      {...props}
    >
      {side === "start" ? (
        <>
          {panel}
          {trigger}
        </>
      ) : (
        <>
          {trigger}
          {panel}
        </>
      )}
    </div>
  );

  if (anchor === "trigger") {
    return (
      <div
        data-slot="expandable-toolbar-anchor"
        data-state={isOpen ? "open" : "closed"}
        data-side={side}
        className="relative inline-flex size-8 shrink-0"
      >
        <motion.div
          className={cn(
            "absolute top-0",
            side === "start" ? "right-0" : "left-0",
          )}
        >
          {toolbar}
        </motion.div>
      </div>
    );
  }

  return toolbar;
}

function DefaultExpandableToolbarTrigger({
  open,
  expandIcon,
  collapseIcon,
  triggerProps,
}: {
  open: boolean;
  expandIcon?: ReactNode;
  collapseIcon?: ReactNode;
  triggerProps: ExpandableToolbarTriggerProps;
}) {
  const { className, ...buttonProps } = triggerProps;
  const icon = open ? (collapseIcon ?? expandIcon) : expandIcon;

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={cn(
        "relative z-10 size-full bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground aria-expanded:bg-transparent aria-expanded:text-foreground active:scale-100 active:translate-y-0 active:not-aria-[haspopup]:translate-y-0 dark:hover:bg-transparent",
        className,
      )}
      {...buttonProps}
    >
      <span aria-hidden="true" className="flex items-center justify-center">
        {icon}
      </span>
    </Button>
  );
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFirstFocusableElement(element: HTMLElement | null) {
  return element?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? null;
}

function useMeasuredWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;

    if (!element) return;

    const updateWidth = (nextWidth: number) => {
      setWidth((currentWidth) =>
        currentWidth === nextWidth ? currentWidth : nextWidth,
      );
    };

    updateWidth(readElementWidth(element));

    if (typeof ResizeObserver === "undefined") return;

    const resizeObserver = new ResizeObserver((entries) => {
      updateWidth(readElementWidth(element, entries[0]));
    });

    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, []);

  return [ref, width] as const;
}

function readElementWidth(
  element: HTMLElement,
  entry?: ResizeObserverEntry,
) {
  const borderBoxSize = Array.isArray(entry?.borderBoxSize)
    ? entry?.borderBoxSize[0]
    : entry?.borderBoxSize;

  if (borderBoxSize) {
    return Math.ceil(borderBoxSize.inlineSize);
  }

  return Math.ceil(element.getBoundingClientRect().width || element.scrollWidth);
}
