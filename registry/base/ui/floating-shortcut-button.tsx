"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonProps = React.ComponentProps<typeof Button>;
type ButtonClickEvent = Parameters<NonNullable<ButtonProps["onClick"]>>[0];
type ButtonKeyDownEvent = Parameters<
  NonNullable<ButtonProps["onKeyDown"]>
>[0];
export type FloatingShortcutTriggerProps = Omit<
  ButtonProps,
  | "aria-controls"
  | "aria-expanded"
  | "aria-haspopup"
  | "aria-label"
  | "children"
  | "ref"
  | "role"
  | "size"
  | "style"
  | "type"
  | "variant"
>;

export type FloatingShortcutButtonSize = "sm" | "md" | "lg";

export type FloatingShortcutMetrics = {
  triggerSize: number;
  openTriggerSize: number;
  actionSize: number;
  triggerIconSize: number;
  closeIconSize: number;
  actionIconSize: number;
  stackGap: number;
  triggerGap: number;
  rowGap: number;
  captionGap: number;
};

export type FloatingShortcutMotion = {
  /** Total duration in milliseconds. Delay and stagger preserve their ratios. */
  duration: number;
  /** Vertical travel used by action rows. */
  distance: number;
  /** Scale applied while an action is pressed. */
  pressScale: number;
};

export type FloatingShortcutButtonClassNames = {
  root?: string;
  menu?: string;
  triggerSlot?: string;
  trigger?: string;
  triggerSurface?: string;
  triggerFace?: string;
  triggerIcon?: string;
  caption?: string;
  closeFace?: string;
  actionRow?: string;
  actionButton?: string;
  actionIcon?: string;
  actionLabel?: string;
};

export const floatingShortcutSizePresets = {
  sm: {
    triggerSize: 48,
    openTriggerSize: 36,
    actionSize: 40,
    triggerIconSize: 18,
    closeIconSize: 24,
    actionIconSize: 18,
    stackGap: 6,
    triggerGap: 6,
    rowGap: 6,
    captionGap: 2,
  },
  md: {
    triggerSize: 56,
    openTriggerSize: 40,
    actionSize: 48,
    triggerIconSize: 20,
    closeIconSize: 28,
    actionIconSize: 20,
    stackGap: 8,
    triggerGap: 8,
    rowGap: 8,
    captionGap: 2,
  },
  lg: {
    triggerSize: 64,
    openTriggerSize: 44,
    actionSize: 56,
    triggerIconSize: 24,
    closeIconSize: 32,
    actionIconSize: 24,
    stackGap: 10,
    triggerGap: 10,
    rowGap: 10,
    captionGap: 3,
  },
} satisfies Record<FloatingShortcutButtonSize, FloatingShortcutMetrics>;

export const floatingShortcutMotionDefault = {
  duration: 170,
  distance: 8,
  pressScale: 0.97,
} satisfies FloatingShortcutMotion;

const ICON_SWAP_DELAY_RATIO = 0.5;
const ACTION_STAGGER_RATIO = 0.2;
const PRESS_DURATION_RATIO = 130 / 170;

function resolvePositive(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function resolveNonNegative(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

function resolveMetrics(
  size: FloatingShortcutButtonSize,
  overrides?: Partial<FloatingShortcutMetrics>,
): FloatingShortcutMetrics {
  const preset = floatingShortcutSizePresets[size];

  return {
    triggerSize: resolvePositive(overrides?.triggerSize, preset.triggerSize),
    openTriggerSize: resolvePositive(
      overrides?.openTriggerSize,
      preset.openTriggerSize,
    ),
    actionSize: resolvePositive(overrides?.actionSize, preset.actionSize),
    triggerIconSize: resolvePositive(
      overrides?.triggerIconSize,
      preset.triggerIconSize,
    ),
    closeIconSize: resolvePositive(
      overrides?.closeIconSize,
      preset.closeIconSize,
    ),
    actionIconSize: resolvePositive(
      overrides?.actionIconSize,
      preset.actionIconSize,
    ),
    stackGap: resolveNonNegative(overrides?.stackGap, preset.stackGap),
    triggerGap: resolveNonNegative(overrides?.triggerGap, preset.triggerGap),
    rowGap: resolveNonNegative(overrides?.rowGap, preset.rowGap),
    captionGap: resolveNonNegative(overrides?.captionGap, preset.captionGap),
  };
}

function resolveMotion(
  overrides?: Partial<FloatingShortcutMotion>,
): FloatingShortcutMotion {
  return {
    duration: resolvePositive(
      overrides?.duration,
      floatingShortcutMotionDefault.duration,
    ),
    distance: resolveNonNegative(
      overrides?.distance,
      floatingShortcutMotionDefault.distance,
    ),
    pressScale: resolvePositive(
      overrides?.pressScale,
      floatingShortcutMotionDefault.pressScale,
    ),
  };
}

function createActionItemVariants(
  motionConfig: FloatingShortcutMotion,
  reduceMotion: boolean,
) {
  const duration = motionConfig.duration / 1000;

  return {
    open: {
      opacity: 1,
      y: 0,
      transition: { duration, ease: "easeOut" },
    },
    closed: {
      opacity: 0,
      y: reduceMotion ? 0 : motionConfig.distance,
      transition: { duration, ease: "easeOut" },
    },
  } satisfies Variants;
}

function createActionListVariants(duration: number) {
  return {
    open: {
      transition: {
        staggerChildren: (duration * ACTION_STAGGER_RATIO) / 1000,
        staggerDirection: -1,
      },
    },
    closed: {
      transition: { staggerChildren: 0 },
    },
  } satisfies Variants;
}

const fallbackActionItemVariants = createActionItemVariants(
  floatingShortcutMotionDefault,
  false,
);

type FloatingShortcutContextValue = {
  close: () => void;
  closeOnAction: boolean;
  metrics: FloatingShortcutMetrics;
  motion: FloatingShortcutMotion;
  actionItemVariants: Variants;
  classNames?: FloatingShortcutButtonClassNames;
};

const FloatingShortcutContext = React.createContext<
  FloatingShortcutContextValue | undefined
>(undefined);

function ShortcutGridIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <g transform="translate(2 2)">
        <path
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6 11a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3v-3a3 3 0 0 1 3-3zm-3 2a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1zm14-2a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3h-3a3 3 0 0 1-3-3v-3a3 3 0 0 1 3-3zm-3 2a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1zM6.154.004A3 3 0 0 1 9 3v3a3 3 0 0 1-3 3H3A3 3 0 0 1 .004 6.154L0 6V3a3 3 0 0 1 3-3h3zM3 2a1 1 0 0 0-1 1v3l.005.103A1 1 0 0 0 3 7h3a1 1 0 0 0 1-1V3a1 1 0 0 0-.897-.995L6 2zM17.154.004A3 3 0 0 1 20 3v3a3 3 0 0 1-3 3h-3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3h3zM14 2a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V3a1 1 0 0 0-.898-.995L17 2z"
        />
      </g>
    </svg>
  );
}

function ShortcutCloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="m5.5 5.5 13 13m0-13-13 13" />
    </svg>
  );
}

export type FloatingShortcutButtonProps = Omit<
  React.ComponentProps<"div">,
  "onChange"
> & {
  /** FloatingShortcutAction elements revealed above the trigger. */
  children: React.ReactNode;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state for uncontrolled usage. */
  defaultOpen?: boolean;
  /** Called after the menu requests an open-state change. */
  onOpenChange?: (open: boolean) => void;
  /** Icon shown while the shortcut menu is closed. */
  triggerIcon?: React.ReactNode;
  /** Short caption shown under the trigger icon. Set to null to hide it. */
  triggerCaption?: React.ReactNode;
  /** Accessible name for the closed trigger. */
  triggerLabel?: string;
  /** Accessible name for the open trigger. */
  closeLabel?: string;
  /** Coordinated geometry preset. @default "md" */
  size?: FloatingShortcutButtonSize;
  /** Advanced geometry overrides. Invalid values fall back to the size preset. */
  metrics?: Partial<FloatingShortcutMetrics>;
  /** Motion overrides. Related delay and stagger values keep their ratios. */
  motion?: Partial<FloatingShortcutMotion>;
  /** Classes for styling individual component slots. */
  classNames?: FloatingShortcutButtonClassNames;
  /** Props forwarded to the trigger button. */
  triggerProps?: FloatingShortcutTriggerProps;
  /** Close the menu after an action runs. @default true */
  closeOnAction?: boolean;
};

export type FloatingShortcutActionProps = Omit<
  ButtonProps,
  | "aria-label"
  | "children"
  | "role"
  | "size"
  | "style"
  | "type"
  | "variant"
> & {
  /** Visible action label and accessible name. */
  label: string;
  /** Icon rendered inside the circular action button. */
  icon: React.ReactNode;
  /** Classes applied to the label-and-button row. */
  rowClassName?: string;
  /** Classes applied to this action's icon wrapper. */
  iconClassName?: string;
  /** Classes applied to this action's visible label. */
  labelClassName?: string;
  /** Inline styles that do not replace geometry controlled by metrics. */
  style?: React.CSSProperties;
};

export function FloatingShortcutButton({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  triggerIcon,
  triggerCaption = "Quick",
  triggerLabel,
  closeLabel = "Close shortcuts",
  size = "md",
  metrics: metricsOverrides,
  motion: motionOverrides,
  classNames,
  triggerProps,
  closeOnAction = true,
  className,
  style,
  onKeyDown,
  ref,
  ...props
}: FloatingShortcutButtonProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const pendingFocusRef = React.useRef<"first" | "last" | null>(null);
  const menuId = React.useId();
  const shouldReduceMotion = useReducedMotion() ?? false;
  const resolvedMetrics = React.useMemo(
    () => resolveMetrics(size, metricsOverrides),
    [metricsOverrides, size],
  );
  const resolvedMotion = React.useMemo(
    () => resolveMotion(motionOverrides),
    [motionOverrides],
  );
  const actionListVariants = React.useMemo(
    () => createActionListVariants(resolvedMotion.duration),
    [resolvedMotion.duration],
  );
  const actionItemVariants = React.useMemo(
    () => createActionItemVariants(resolvedMotion, shouldReduceMotion),
    [resolvedMotion, shouldReduceMotion],
  );
  const iconDelay = resolvedMotion.duration * ICON_SWAP_DELAY_RATIO;
  const openScale =
    resolvedMetrics.openTriggerSize / resolvedMetrics.triggerSize;
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : internalOpen;
  const resolvedTriggerLabel =
    triggerLabel ??
    (typeof triggerCaption === "string" ? triggerCaption : "Open shortcuts");
  const {
    className: triggerClassName,
    disabled: triggerDisabled,
    onClick: onTriggerClick,
    onKeyDown: onTriggerKeyDown,
    ...restTriggerProps
  } = triggerProps ?? {};
  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!controlled) {
        setInternalOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [controlled, onOpenChange],
  );

  // The root node is needed internally (menu-item queries, outside-click) *and*
  // by consumers, so the consumer's ref is merged in rather than overwritten.
  const setRootRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;

      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  const getEnabledItems = React.useCallback(
    () =>
      Array.from(
        rootRef.current?.querySelectorAll<HTMLButtonElement>(
          "[role='menuitem']:not(:disabled)",
        ) ?? [],
      ),
    [],
  );

  const close = React.useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, [setOpen]);

  React.useEffect(() => {
    if (!open) return;

    // The ARIA menu-button pattern dismisses on outside interaction. Focus is
    // intentionally left where the user clicked (unlike Escape, which returns
    // it to the trigger).
    const handlePointerDown = (event: PointerEvent) => {
      const root = rootRef.current;

      if (!root || !(event.target instanceof Node)) return;
      if (root.contains(event.target)) return;

      setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open, setOpen]);

  React.useEffect(() => {
    if (!open || !pendingFocusRef.current) return;

    const items = getEnabledItems();
    const pendingFocus = pendingFocusRef.current;
    pendingFocusRef.current = null;
    const item = pendingFocus === "first" ? items[0] : items.at(-1);

    item?.focus();
  }, [getEnabledItems, open]);

  const handleTriggerClick = (event: ButtonClickEvent) => {
    onTriggerClick?.(event);

    if (event.defaultPrevented || triggerDisabled) return;

    setOpen(!open);
  };

  const handleTriggerKeyDown = (event: ButtonKeyDownEvent) => {
    onTriggerKeyDown?.(event);

    if (event.defaultPrevented || triggerDisabled) return;
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    event.preventDefault();
    pendingFocusRef.current = event.key === "ArrowDown" ? "first" : "last";

    if (open) {
      const items = getEnabledItems();
      const item = event.key === "ArrowDown" ? items[0] : items.at(-1);
      pendingFocusRef.current = null;
      item?.focus();
      return;
    }

    setOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);

    if (event.defaultPrevented || !open) return;

    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    const items = getEnabledItems();
    const activeIndex = items.indexOf(document.activeElement as HTMLButtonElement);

    if (activeIndex === -1) return;

    let nextIndex: number | undefined;

    if (event.key === "ArrowDown") {
      nextIndex = (activeIndex + 1) % items.length;
    } else if (event.key === "ArrowUp") {
      nextIndex = (activeIndex - 1 + items.length) % items.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    }

    if (nextIndex !== undefined) {
      event.preventDefault();
      items[nextIndex]?.focus();
    }
  };

  return (
    <FloatingShortcutContext.Provider
      value={{
        close,
        closeOnAction,
        metrics: resolvedMetrics,
        motion: resolvedMotion,
        actionItemVariants,
        classNames,
      }}
    >
      <div
        {...props}
        ref={setRootRef}
        data-slot="floating-shortcut-button"
        data-state={open ? "open" : "closed"}
        className={cn(
          "relative inline-flex flex-col items-end",
          classNames?.root,
          className,
        )}
        style={{ gap: resolvedMetrics.triggerGap, ...style }}
        onKeyDown={handleKeyDown}
      >
        <motion.div
          id={menuId}
          role="menu"
          aria-hidden={!open}
          inert={!open || undefined}
          data-slot="floating-shortcut-menu"
          className={cn("flex flex-col items-end", classNames?.menu)}
          style={{ gap: resolvedMetrics.stackGap }}
          variants={actionListVariants}
          initial={false}
          animate={open ? "open" : "closed"}
        >
          {children}
        </motion.div>

        <div
          data-slot="floating-shortcut-trigger-slot"
          className={cn(
            "relative grid place-items-center",
            classNames?.triggerSlot,
          )}
          style={{
            width: resolvedMetrics.triggerSize,
            height: resolvedMetrics.triggerSize,
          }}
        >
          <Button
            {...restTriggerProps}
            ref={triggerRef}
            type="button"
            variant="link"
            size="icon-lg"
            disabled={triggerDisabled}
            aria-label={open ? closeLabel : resolvedTriggerLabel}
            aria-expanded={open}
            aria-haspopup="menu"
            aria-controls={menuId}
            onClick={handleTriggerClick}
            onKeyDown={handleTriggerKeyDown}
            className={cn(
              "relative origin-center rounded-full p-0 no-underline",
              classNames?.trigger,
              triggerClassName,
            )}
            style={{
              width: resolvedMetrics.triggerSize,
              height: resolvedMetrics.triggerSize,
            }}
          >
            <span
              aria-hidden="true"
              data-slot="floating-shortcut-trigger-surface"
              className={cn(
                "pointer-events-none absolute inset-0 rounded-full bg-primary shadow-sm transition-[transform,background-color] ease-in-out group-hover/button:bg-primary/90 group-active/button:bg-primary/90 motion-reduce:transition-none",
                classNames?.triggerSurface,
              )}
              style={{
                transform: `scale(${open ? openScale : 1})`,
                transitionDuration: `${resolvedMotion.duration}ms`,
              }}
            />
          </Button>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid place-items-center text-primary-foreground"
          >
            <span
              data-slot="floating-shortcut-trigger-face"
              className={cn(
                "col-start-1 row-start-1 flex flex-col items-center transition-[opacity,filter] ease-out motion-reduce:transition-none",
                open ? "opacity-0 blur-xs" : "opacity-100 blur-none",
                classNames?.triggerFace,
              )}
              style={{
                gap: resolvedMetrics.captionGap,
                transitionDuration: `${resolvedMotion.duration}ms`,
                transitionDelay: open ? "0ms" : `${iconDelay}ms`,
              }}
            >
              <span
                data-slot="floating-shortcut-trigger-icon"
                className={cn(
                  "grid place-items-center [&_svg]:size-full",
                  classNames?.triggerIcon,
                )}
                style={{
                  width: resolvedMetrics.triggerIconSize,
                  height: resolvedMetrics.triggerIconSize,
                }}
              >
                {triggerIcon ?? <ShortcutGridIcon />}
              </span>
              {triggerCaption ? (
                <span
                  data-slot="floating-shortcut-caption"
                  className={cn(
                    "text-xs font-medium leading-none",
                    classNames?.caption,
                  )}
                >
                  {triggerCaption}
                </span>
              ) : null}
            </span>
            <span
              data-slot="floating-shortcut-close-face"
              className={cn(
                "col-start-1 row-start-1 grid place-items-center transition-[opacity,filter] ease-out motion-reduce:transition-none [&_svg]:size-full",
                open ? "opacity-100 blur-none" : "opacity-0 blur-xs",
                classNames?.closeFace,
              )}
              style={{
                width: resolvedMetrics.closeIconSize,
                height: resolvedMetrics.closeIconSize,
                transitionDuration: `${resolvedMotion.duration}ms`,
                transitionDelay: open ? `${iconDelay}ms` : "0ms",
              }}
            >
              <ShortcutCloseIcon />
            </span>
          </div>
        </div>
      </div>
    </FloatingShortcutContext.Provider>
  );
}

export function FloatingShortcutAction({
  label,
  icon,
  rowClassName,
  iconClassName,
  labelClassName,
  className,
  style,
  onClick,
  ...props
}: FloatingShortcutActionProps) {
  const context = React.useContext(FloatingShortcutContext);
  const metrics = context?.metrics ?? floatingShortcutSizePresets.md;
  const motionConfig = context?.motion ?? floatingShortcutMotionDefault;
  const actionOffset = (metrics.triggerSize - metrics.actionSize) / 2;
  const pressDuration = motionConfig.duration * PRESS_DURATION_RATIO;
  const resolvedStyle: React.CSSProperties & {
    "--floating-shortcut-press-scale": number;
  } = {
    ...style,
    width: metrics.actionSize,
    height: metrics.actionSize,
    marginInlineEnd: actionOffset,
    transitionDuration: `${pressDuration}ms`,
    "--floating-shortcut-press-scale": motionConfig.pressScale,
  };

  const handleClick = (event: ButtonClickEvent) => {
    onClick?.(event);

    if (!event.defaultPrevented && context?.closeOnAction) {
      context?.close();
    }
  };

  return (
    <motion.div
      role="none"
      data-slot="floating-shortcut-action-row"
      variants={context?.actionItemVariants ?? fallbackActionItemVariants}
      className={cn(
        "flex items-center",
        context?.classNames?.actionRow,
        rowClassName,
      )}
      style={{ gap: metrics.rowGap }}
    >
      <span
        data-slot="floating-shortcut-action-label"
        className={cn(
          "text-sm font-medium text-foreground",
          context?.classNames?.actionLabel,
          labelClassName,
        )}
      >
        {label}
      </span>
      <Button
        {...props}
        type="button"
        role="menuitem"
        variant="ghost"
        size="icon-lg"
        aria-label={label}
        onClick={handleClick}
        className={cn(
          "rounded-full border-border bg-card text-card-foreground shadow-sm transition-[transform,background-color] ease-out hover:bg-accent active:scale-[var(--floating-shortcut-press-scale)] active:bg-accent/70 disabled:opacity-40 motion-reduce:transform-none motion-reduce:transition-none",
          context?.classNames?.actionButton,
          className,
        )}
        style={resolvedStyle}
      >
        <span
          data-slot="floating-shortcut-action-icon"
          className={cn(
            "grid place-items-center [&_svg]:size-full",
            context?.classNames?.actionIcon,
            iconClassName,
          )}
          style={{ width: metrics.actionIconSize, height: metrics.actionIconSize }}
        >
          {icon}
        </span>
      </Button>
    </motion.div>
  );
}
