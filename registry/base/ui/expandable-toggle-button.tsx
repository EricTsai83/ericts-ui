"use client";

import * as React from "react";
import {
  animate,
  motion,
  useReducedMotion,
  type Transition,
} from "motion/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonProps = React.ComponentPropsWithoutRef<typeof Button>;
type ButtonClickEvent = Parameters<NonNullable<ButtonProps["onClick"]>>[0];
type ExpandableToggleButtonSize = "default" | "xs" | "sm" | "lg";

const COLLAPSED_WIDTH: Record<ExpandableToggleButtonSize, number> = {
  default: 32,
  xs: 24,
  sm: 28,
  lg: 36,
};

const ICON_SIZE: Record<ExpandableToggleButtonSize, number> = {
  default: 16,
  xs: 12,
  sm: 14,
  lg: 18,
};

const LABEL_OUTER_PADDING: Record<ExpandableToggleButtonSize, number> = {
  default: 10,
  xs: 8,
  sm: 10,
  lg: 10,
};

const LABEL_ICON_GAP = 6;

const MORPH_TRANSITION: Transition = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1],
};

const REDUCED_TRANSITION: Transition = { duration: 0 };
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

export type ExpandableToggleButtonProps = Omit<
  ButtonProps,
  | "aria-label"
  | "aria-pressed"
  | "children"
  | "onClick"
  | "size"
> & {
  /** Controlled active state. */
  active?: boolean;
  /** Initial active state for uncontrolled usage. */
  defaultActive?: boolean;
  /** Called after the button requests an active-state change. */
  onActiveChange?: (active: boolean) => void;
  /** Icon shown while the button is inactive. */
  icon: React.ReactNode;
  /** Optional icon shown while the button is active. */
  activeIcon?: React.ReactNode;
  /** Content revealed while the button is active. */
  label: React.ReactNode;
  /** Accessible name used while the button is inactive. */
  inactiveLabel: string;
  /** Accessible name used while the button is active. */
  activeLabel: string;
  /** Direction the label grows toward while the icon stays anchored. */
  expandFrom?: "start" | "end";
  /** Text-button size; the inactive width matches its icon-only counterpart. */
  size?: ExpandableToggleButtonSize;
  onClick?: (event: ButtonClickEvent) => void;
};

export const ExpandableToggleButton = React.forwardRef<
  HTMLButtonElement,
  ExpandableToggleButtonProps
>(function ExpandableToggleButton(
  {
    active,
    defaultActive = false,
    onActiveChange,
    icon,
    activeIcon,
    label,
    inactiveLabel,
    activeLabel,
    expandFrom = "end",
    variant = "outline",
    size = "lg",
    disabled,
    className,
    style,
    onClick,
    type = "button",
    ...props
  },
  ref,
) {
  const [internalActive, setInternalActive] = React.useState(defaultActive);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const contentRef = React.useRef<HTMLSpanElement | null>(null);
  const hasMeasuredRef = React.useRef(false);
  const shouldReduceMotion = useReducedMotion();
  const controlled = active !== undefined;
  const isActive = controlled ? active : internalActive;
  const transition = shouldReduceMotion
    ? REDUCED_TRANSITION
    : MORPH_TRANSITION;
  const resolvedSize = size ?? "lg";
  const collapsedWidth = COLLAPSED_WIDTH[resolvedSize];
  const iconSize = ICON_SIZE[resolvedSize];
  const labelOuterPadding = LABEL_OUTER_PADDING[resolvedSize];
  const iconReserve =
    collapsedWidth / 2 + iconSize / 2 + LABEL_ICON_GAP;

  const setButtonRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      buttonRef.current = node;

      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  useIsomorphicLayoutEffect(() => {
    const button = buttonRef.current;
    const content = contentRef.current;

    if (!button || !content) return;

    const styles = getComputedStyle(button);
    const expandedWidth = Math.ceil(
      content.getBoundingClientRect().width +
        Number.parseFloat(styles.paddingLeft) +
        Number.parseFloat(styles.paddingRight) +
        Number.parseFloat(styles.borderLeftWidth) +
        Number.parseFloat(styles.borderRightWidth),
    );
    const targetWidth = isActive ? expandedWidth : collapsedWidth;

    if (!hasMeasuredRef.current || shouldReduceMotion) {
      button.style.width = `${targetWidth}px`;
      hasMeasuredRef.current = true;
      return;
    }

    const controls = animate(button, { width: targetWidth }, MORPH_TRANSITION);

    return () => controls.stop();
  }, [collapsedWidth, isActive, label, shouldReduceMotion]);

  const handleClick = React.useCallback(
    (event: ButtonClickEvent) => {
      onClick?.(event);

      if (event.defaultPrevented || disabled) return;

      const nextActive = !isActive;

      if (!controlled) {
        setInternalActive(nextActive);
      }

      onActiveChange?.(nextActive);
    }, [controlled, disabled, isActive, onActiveChange, onClick],
  );

  const labelSlot = (
    <motion.span
      aria-hidden={!isActive}
      data-slot="expandable-toggle-button-label"
      initial={false}
      animate={{ opacity: isActive ? 1 : 0 }}
      transition={transition}
      className="inline-flex shrink-0 items-center gap-1"
      style={
        expandFrom === "start"
          ? { paddingLeft: labelOuterPadding }
          : { paddingRight: labelOuterPadding }
      }
    >
      {label}
    </motion.span>
  );

  const iconSpacer = (
    <span
      aria-hidden="true"
      data-slot="expandable-toggle-button-icon-spacer"
      className="h-full shrink-0"
      style={{ width: iconReserve }}
    />
  );

  return (
    <span
      data-slot="expandable-toggle-button-anchor"
      className="relative inline-flex shrink-0 align-middle"
      style={{ width: collapsedWidth, height: collapsedWidth }}
    >
      <Button
        ref={setButtonRef}
        type={type}
        size={resolvedSize}
        variant={variant}
        disabled={disabled}
        aria-label={isActive ? activeLabel : inactiveLabel}
        aria-pressed={isActive}
        data-active={isActive}
        data-slot="expandable-toggle-button"
        onClick={handleClick}
        // `width` stays component-managed (it is animated imperatively);
        // everything else in `style` passes through.
        style={{ ...style, width: collapsedWidth }}
        className={cn(
          "absolute top-0 gap-0! overflow-hidden p-0! transition-colors will-change-[width] motion-reduce:transition-none",
          expandFrom === "start" ? "right-0 justify-end" : "left-0 justify-start",
          className,
        )}
        {...props}
      >
        <span
          ref={contentRef}
          className="inline-flex h-full shrink-0 items-center"
        >
          {expandFrom === "start" ? labelSlot : iconSpacer}
          {expandFrom === "start" ? iconSpacer : labelSlot}
        </span>
        <span
          aria-hidden="true"
          data-icon={expandFrom === "start" ? "inline-end" : "inline-start"}
          data-slot="expandable-toggle-button-icon"
          className={cn(
            "absolute inset-y-0 flex items-center justify-center",
            expandFrom === "start" ? "-right-px" : "-left-px",
          )}
          style={{ width: collapsedWidth }}
        >
          <span
            className="relative block shrink-0"
            style={{ width: iconSize, height: iconSize }}
          >
            <motion.span
              initial={false}
              animate={{ opacity: isActive && activeIcon ? 0 : 1 }}
              transition={transition}
              className="absolute inset-0 flex items-center justify-center [&_svg]:size-full!"
            >
              {icon}
            </motion.span>
            {activeIcon ? (
              <motion.span
                initial={false}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={transition}
                className="absolute inset-0 flex items-center justify-center [&_svg]:size-full!"
              >
                {activeIcon}
              </motion.span>
            ) : null}
          </span>
        </span>
      </Button>
    </span>
  );
});
