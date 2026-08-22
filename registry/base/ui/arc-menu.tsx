"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonProps = React.ComponentProps<typeof Button>;
type ButtonClickEvent = Parameters<NonNullable<ButtonProps["onClick"]>>[0];
type ButtonKeyDownEvent = Parameters<
  NonNullable<ButtonProps["onKeyDown"]>
>[0];

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
const ITEM_DURATION_SECONDS = 0.22;
const TRIGGER_DURATION_SECONDS = 0.17;
const ICON_SWAP_DELAY_SECONDS = TRIGGER_DURATION_SECONDS / 2;
const REDUCED_DURATION_SECONDS = 0.12;

export type ArcMenuClassNames = {
  root?: string;
  menu?: string;
  actionSlot?: string;
  actionButton?: string;
  actionIcon?: string;
  trigger?: string;
  triggerSurface?: string;
  triggerFace?: string;
  triggerIcon?: string;
  caption?: string;
  closeIcon?: string;
};

export type ArcMenuTriggerProps = Omit<
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

type ArcMenuContextValue = {
  actionSize: number;
  actionIconSize: number;
  classNames?: ArcMenuClassNames;
  close: (skipMotion?: boolean) => void;
  closeOnAction: boolean;
};

const ArcMenuContext = React.createContext<ArcMenuContextValue | undefined>(
  undefined,
);

function useArcMenuContext() {
  const context = React.useContext(ArcMenuContext);

  if (!context) {
    throw new Error("ArcMenuAction must be used inside ArcMenu.");
  }

  return context;
}

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

function CloseIcon() {
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

function resolvePositive(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function resolveAngle(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not(:disabled)",
  "input:not(:disabled)",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function focusAdjacentToTrigger(
  trigger: HTMLButtonElement | null,
  direction: -1 | 1,
) {
  if (!trigger) return;

  const focusableElements = Array.from(
    document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.hasAttribute("hidden") &&
      !element.closest("[inert]") &&
      !element.closest('[aria-hidden="true"]'),
  );
  const triggerIndex = focusableElements.indexOf(trigger);

  if (triggerIndex === -1) {
    trigger.focus();
    return;
  }

  const target = focusableElements[triggerIndex + direction];

  (target ?? trigger).focus();
}

function getArcPosition({
  count,
  endAngle,
  index,
  radius,
  startAngle,
}: {
  count: number;
  endAngle: number;
  index: number;
  radius: number;
  startAngle: number;
}) {
  const progress = count <= 1 ? 0.5 : index / (count - 1);
  const angle = startAngle + (endAngle - startAngle) * progress;
  const radians = (angle * Math.PI) / 180;

  return {
    x: Math.cos(radians) * radius,
    y: Math.sin(radians) * radius,
  };
}

export type ArcMenuProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  /** ArcMenuAction elements distributed along the arc. */
  children: React.ReactNode;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state for uncontrolled usage. */
  defaultOpen?: boolean;
  /** Called whenever the menu requests an open-state change. */
  onOpenChange?: (open: boolean) => void;
  /** Radius from the trigger center to each action center, in pixels. */
  radius?: number;
  /** First action angle in degrees. -90 points straight up. */
  startAngle?: number;
  /** Last action angle in degrees. -90 points straight up. */
  endAngle?: number;
  /** Circular trigger size in pixels. */
  triggerSize?: number;
  /** Visual trigger size when its caption is hidden. The hit area stays unchanged. */
  iconOnlyTriggerSize?: number;
  /** Visual trigger size while the menu is open. The hit area stays unchanged. */
  openTriggerSize?: number;
  /** Circular action size in pixels. */
  actionSize?: number;
  /** Trigger icon size in pixels. */
  triggerIconSize?: number;
  /** Close icon size in pixels. */
  closeIconSize?: number;
  /** Action icon size in pixels. */
  actionIconSize?: number;
  /** Icon shown while the menu is closed. */
  triggerIcon?: React.ReactNode;
  /** Short caption shown under the trigger icon. */
  triggerCaption?: React.ReactNode;
  /** Whether to render the trigger caption. Its text still labels the button. */
  showTriggerCaption?: boolean;
  /** Icon shown while the menu is open. */
  closeIcon?: React.ReactNode;
  /** Accessible name for the closed trigger. */
  triggerLabel?: string;
  /** Accessible name for the open trigger. */
  closeLabel?: string;
  /** Accessible name for the menu. */
  menuLabel?: string;
  /** Close the menu after an action runs. @default true */
  closeOnAction?: boolean;
  /** Props forwarded to the trigger button. */
  triggerProps?: ArcMenuTriggerProps;
  /** Classes for styling individual component slots. */
  classNames?: ArcMenuClassNames;
};

export type ArcMenuActionProps = Omit<
  ButtonProps,
  "aria-label" | "children" | "role" | "size" | "style" | "type" | "variant"
> & {
  /** Visible tooltip text and accessible name. */
  label: string;
  /** Icon rendered inside the circular action button. */
  icon: React.ReactNode;
  /** Override the root menu's close-on-action behavior. */
  closeOnAction?: boolean;
  /** Classes applied to this action's icon wrapper. */
  iconClassName?: string;
  /** Inline styles that do not replace action geometry. */
  style?: React.CSSProperties;
};

export function ArcMenu({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  radius = 72,
  startAngle = -150,
  endAngle = -30,
  triggerSize = 56,
  iconOnlyTriggerSize = 48,
  openTriggerSize = 40,
  actionSize = 40,
  triggerIconSize = 20,
  closeIconSize = 28,
  actionIconSize = 16,
  triggerIcon,
  triggerCaption = "Quick",
  showTriggerCaption = true,
  closeIcon,
  triggerLabel,
  closeLabel = "Close and retract shortcuts",
  menuLabel = "Shortcuts",
  closeOnAction = true,
  triggerProps,
  classNames,
  className,
  style,
  onKeyDown,
  ref,
  ...props
}: ArcMenuProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const [skipMotion, setSkipMotion] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const pendingFocusRef = React.useRef<"first" | "last" | null>(null);
  const menuId = React.useId();
  const shouldReduceMotion = useReducedMotion() ?? false;
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : internalOpen;
  const menuItems = React.Children.toArray(children);
  const resolvedRadius = resolvePositive(radius, 72);
  const resolvedTriggerSize = resolvePositive(triggerSize, 56);
  const resolvedIconOnlyTriggerSize = resolvePositive(
    iconOnlyTriggerSize,
    48,
  );
  const resolvedOpenTriggerSize = resolvePositive(openTriggerSize, 40);
  const resolvedActionSize = resolvePositive(actionSize, 40);
  const resolvedTriggerIconSize = resolvePositive(triggerIconSize, 20);
  const resolvedCloseIconSize = resolvePositive(closeIconSize, 28);
  const resolvedActionIconSize = resolvePositive(actionIconSize, 16);
  const hasVisibleTriggerCaption =
    showTriggerCaption && Boolean(triggerCaption);
  const closedTriggerScale = hasVisibleTriggerCaption
    ? 1
    : Math.min(resolvedIconOnlyTriggerSize, resolvedTriggerSize) /
      resolvedTriggerSize;
  const openTriggerScale = resolvedOpenTriggerSize / resolvedTriggerSize;
  const captionLabel =
    typeof triggerCaption === "string" ? triggerCaption.trim() : "";
  const resolvedTriggerLabel =
    triggerLabel?.trim() || captionLabel || "Open shortcuts";
  const resolvedCloseLabel =
    closeLabel.trim() || "Close and retract shortcuts";
  const resolvedMenuLabel = menuLabel.trim() || "Shortcuts";
  const resolvedStartAngle = resolveAngle(startAngle, -150);
  const resolvedEndAngle = resolveAngle(endAngle, -30);
  const {
    className: triggerClassName,
    disabled: triggerDisabled,
    onClick: onTriggerClick,
    onKeyDown: onTriggerKeyDown,
    ...restTriggerProps
  } = triggerProps ?? {};

  const setOpen = React.useCallback(
    (nextOpen: boolean, shouldSkipMotion = false) => {
      setSkipMotion(shouldSkipMotion);

      if (!controlled) {
        setInternalOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [controlled, onOpenChange],
  );

  React.useEffect(() => {
    if (!skipMotion) return;

    const frame = window.requestAnimationFrame(() => setSkipMotion(false));

    return () => window.cancelAnimationFrame(frame);
  }, [open, skipMotion]);

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

  const close = React.useCallback(
    (shouldSkipMotion = false) => {
      setOpen(false, shouldSkipMotion);
      triggerRef.current?.focus();
    },
    [setOpen],
  );

  React.useEffect(() => {
    if (!open) return;

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
    const target =
      pendingFocusRef.current === "first" ? items[0] : items.at(-1);

    pendingFocusRef.current = null;
    target?.focus();
  }, [getEnabledItems, open]);

  const handleTriggerClick = (event: ButtonClickEvent) => {
    onTriggerClick?.(event);

    if (event.defaultPrevented || triggerDisabled) return;

    if (!open) {
      pendingFocusRef.current = "first";
    }

    setOpen(!open, event.detail === 0);
  };

  const handleTriggerKeyDown = (event: ButtonKeyDownEvent) => {
    onTriggerKeyDown?.(event);

    if (event.defaultPrevented || triggerDisabled) return;
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    event.preventDefault();
    pendingFocusRef.current = event.key === "ArrowDown" ? "first" : "last";

    if (!open) {
      setOpen(true, true);
      return;
    }

    const items = getEnabledItems();
    const target = event.key === "ArrowDown" ? items[0] : items.at(-1);

    pendingFocusRef.current = null;
    target?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);

    if (event.defaultPrevented || !open) return;

    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      setOpen(false, true);
      focusAdjacentToTrigger(triggerRef.current, event.shiftKey ? -1 : 1);
      return;
    }

    const items = getEnabledItems();
    const activeIndex = items.indexOf(
      document.activeElement as HTMLButtonElement,
    );

    if (activeIndex === -1 || items.length === 0) return;

    let nextIndex: number | undefined;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (activeIndex + 1) % items.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (activeIndex - 1 + items.length) % items.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    } else if (
      event.key.length === 1 &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey
    ) {
      const query = event.key.toLocaleLowerCase();

      for (let offset = 1; offset <= items.length; offset += 1) {
        const candidateIndex = (activeIndex + offset) % items.length;
        const candidateLabel =
          items[candidateIndex]
            ?.getAttribute("aria-label")
            ?.toLocaleLowerCase() ?? "";

        if (candidateLabel.startsWith(query)) {
          nextIndex = candidateIndex;
          break;
        }
      }
    }

    if (nextIndex !== undefined) {
      event.preventDefault();
      items[nextIndex]?.focus();
    }
  };

  const contextValue = React.useMemo<ArcMenuContextValue>(
    () => ({
      actionSize: resolvedActionSize,
      actionIconSize: resolvedActionIconSize,
      classNames,
      close,
      closeOnAction,
    }),
    [
      classNames,
      close,
      closeOnAction,
      resolvedActionIconSize,
      resolvedActionSize,
    ],
  );

  return (
    <ArcMenuContext.Provider value={contextValue}>
      <div
        {...props}
        ref={setRootRef}
        data-slot="arc-menu"
        data-state={open ? "open" : "closed"}
        className={cn(
          "relative isolate inline-grid place-items-center",
          classNames?.root,
          className,
        )}
        style={{
          width: resolvedTriggerSize,
          height: resolvedTriggerSize,
          ...style,
        }}
        onKeyDown={handleKeyDown}
      >
        <ul
          id={menuId}
          role="menu"
          aria-label={resolvedMenuLabel}
          aria-hidden={!open}
          inert={!open || undefined}
          data-slot="arc-menu-list"
          className={cn("absolute inset-0 m-0 list-none p-0", classNames?.menu)}
        >
          {menuItems.map((child, index) => {
            const position = getArcPosition({
              count: menuItems.length,
              endAngle: resolvedEndAngle,
              index,
              radius: resolvedRadius,
              startAngle: resolvedStartAngle,
            });
            const openTransform = `translate3d(${position.x}px, ${position.y}px, 0) scale(1)`;
            const closedTransform = shouldReduceMotion
              ? openTransform
              : "translate3d(0px, 0px, 0) scale(0.94)";

            return (
              <motion.li
                key={React.isValidElement(child) ? child.key ?? index : index}
                role="none"
                data-slot="arc-menu-action-slot"
                className={cn(
                  "absolute top-1/2 left-1/2 grid place-items-center",
                  classNames?.actionSlot,
                )}
                style={{
                  width: resolvedActionSize,
                  height: resolvedActionSize,
                  marginLeft: -resolvedActionSize / 2,
                  marginTop: -resolvedActionSize / 2,
                  pointerEvents: open ? "auto" : "none",
                  willChange: open ? "transform, opacity" : "auto",
                }}
                initial={false}
                animate={{
                  opacity: open ? 1 : 0,
                  transform: open ? openTransform : closedTransform,
                }}
                transition={{
                  duration: skipMotion
                    ? 0
                    : shouldReduceMotion
                      ? REDUCED_DURATION_SECONDS
                      : ITEM_DURATION_SECONDS,
                  ease: EASE_OUT,
                }}
              >
                {child}
              </motion.li>
            );
          })}
        </ul>

        <Button
          {...restTriggerProps}
          ref={triggerRef}
          type="button"
          variant="link"
          size="icon-lg"
          disabled={triggerDisabled}
          aria-label={open ? resolvedCloseLabel : resolvedTriggerLabel}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls={menuId}
          data-state={open ? "open" : "closed"}
          data-slot="arc-menu-trigger"
          onClick={handleTriggerClick}
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            "relative origin-center touch-manipulation rounded-full p-0 no-underline",
            classNames?.trigger,
            triggerClassName,
          )}
          style={{ width: resolvedTriggerSize, height: resolvedTriggerSize }}
        >
          <motion.span
            aria-hidden="true"
            data-slot="arc-menu-trigger-surface"
            className={cn(
              "pointer-events-none absolute inset-0 rounded-full bg-primary shadow-sm transition-colors duration-150 group-hover/button:bg-primary/90 group-active/button:bg-primary/90 motion-reduce:transition-none",
              classNames?.triggerSurface,
            )}
            initial={false}
            animate={{
              transform: `scale(${open ? openTriggerScale : closedTriggerScale})`,
            }}
            transition={{
              duration:
                shouldReduceMotion || skipMotion
                  ? 0
                  : TRIGGER_DURATION_SECONDS,
              ease: EASE_IN_OUT,
            }}
          />
        </Button>

        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 grid place-items-center text-primary-foreground",
            triggerDisabled && "opacity-50",
          )}
        >
          <motion.span
            data-slot="arc-menu-trigger-face"
            className={cn(
              "col-start-1 row-start-1 flex flex-col items-center",
              classNames?.triggerFace,
            )}
            style={{ gap: 2 }}
            initial={false}
            animate={{
              opacity: open ? 0 : 1,
              filter:
                shouldReduceMotion || !open ? "blur(0px)" : "blur(2px)",
            }}
            transition={{
              duration: skipMotion
                ? 0
                : shouldReduceMotion
                  ? REDUCED_DURATION_SECONDS
                  : TRIGGER_DURATION_SECONDS,
              ease: EASE_OUT,
              delay:
                shouldReduceMotion || skipMotion || open
                  ? 0
                  : ICON_SWAP_DELAY_SECONDS,
            }}
          >
            <span
              data-icon
              data-slot="arc-menu-trigger-icon"
              className={cn(
                "grid place-items-center [&_svg]:size-full",
                classNames?.triggerIcon,
              )}
              style={{
                width: resolvedTriggerIconSize,
                height: resolvedTriggerIconSize,
              }}
            >
              {triggerIcon ?? <ShortcutGridIcon />}
            </span>
            {showTriggerCaption && triggerCaption ? (
              <span
                data-slot="arc-menu-caption"
                className={cn(
                  "text-xs font-medium leading-none",
                  classNames?.caption,
                )}
              >
                {triggerCaption}
              </span>
            ) : null}
          </motion.span>

          <motion.span
            data-icon
            data-slot="arc-menu-close-icon"
            className={cn(
              "col-start-1 row-start-1 grid place-items-center [&_svg]:size-full",
              classNames?.closeIcon,
            )}
            style={{
              width: resolvedCloseIconSize,
              height: resolvedCloseIconSize,
            }}
            initial={false}
            animate={{
              opacity: open ? 1 : 0,
              filter:
                shouldReduceMotion || open ? "blur(0px)" : "blur(2px)",
            }}
            transition={{
              duration: skipMotion
                ? 0
                : shouldReduceMotion
                  ? REDUCED_DURATION_SECONDS
                  : TRIGGER_DURATION_SECONDS,
              ease: EASE_OUT,
              delay:
                shouldReduceMotion || skipMotion || !open
                  ? 0
                  : ICON_SWAP_DELAY_SECONDS,
            }}
          >
            {closeIcon ?? <CloseIcon />}
          </motion.span>
        </div>
      </div>
    </ArcMenuContext.Provider>
  );
}

export function ArcMenuAction({
  label,
  icon,
  closeOnAction: closeOnActionProp,
  iconClassName,
  className,
  style,
  onClick,
  disabled,
  ...props
}: ArcMenuActionProps) {
  const context = useArcMenuContext();

  const handleClick = (event: ButtonClickEvent) => {
    onClick?.(event);

    if (event.defaultPrevented || disabled) return;

    if (closeOnActionProp ?? context.closeOnAction) {
      context.close(event.detail === 0);
    }
  };

  return (
    <Button
      {...props}
      type="button"
      role="menuitem"
      variant="outline"
      size="icon-lg"
      disabled={disabled}
      aria-label={label}
      tabIndex={-1}
      title={label}
      data-slot="arc-menu-action"
      onClick={handleClick}
      className={cn(
        "touch-manipulation rounded-full bg-background/90 p-0 shadow-sm backdrop-blur-md transition-[transform,background-color,color,border-color,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] motion-reduce:transform-none motion-reduce:transition-colors",
        context.classNames?.actionButton,
        className,
      )}
      style={{
        ...style,
        width: context.actionSize,
        height: context.actionSize,
      }}
    >
      <span
        aria-hidden="true"
        data-icon
        data-slot="arc-menu-action-icon"
        className={cn(
          "grid place-items-center [&_svg]:size-full",
          context.classNames?.actionIcon,
          iconClassName,
        )}
        style={{
          width: context.actionIconSize,
          height: context.actionIconSize,
        }}
      >
        {icon}
      </span>
    </Button>
  );
}
