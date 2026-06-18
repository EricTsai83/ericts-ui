"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

const variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { opacity: 1, scale: 1 },
};

type ButtonProps = React.ComponentPropsWithoutRef<typeof Button>;
type ButtonClickEvent = Parameters<NonNullable<ButtonProps["onClick"]>>[0];

export type CopyButtonProps = Omit<
  ButtonProps,
  "children" | "value" | "onCopy"
> & {
  /** Text written to the clipboard when the button is pressed. */
  value: string;
  /** How long, in ms, the copied state is shown before reverting. */
  timeout?: number;
  /** Called with the copied value after a successful write. */
  onCopy?: (value: string) => void;
};

export function CopyButton({
  value,
  timeout = 2000,
  onCopy,
  onClick,
  className,
  variant = "outline",
  size = "icon",
  type = "button",
  "aria-label": ariaLabel = "Copy to clipboard",
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleCopy = React.useCallback(
    async (event: ButtonClickEvent) => {
      onClick?.(event);

      if (event.defaultPrevented) return;

      try {
        await navigator.clipboard.writeText(value);
      } catch {
        // Clipboard access can be denied (insecure context, no permission) —
        // bail out without flipping into the copied state.
        return;
      }

      onCopy?.(value);
      setCopied(true);

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), timeout);
    },
    [onClick, onCopy, timeout, value],
  );

  // An icon swap is a tiny state change, so keep it snappy: ease-out, well
  // under 150ms. Motion is removed entirely under prefers-reduced-motion.
  const transition = shouldReduceMotion
    ? { duration: 0 }
    : ({ duration: 0.13, ease: [0.215, 0.61, 0.355, 1] } as const);

  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      aria-label={ariaLabel}
      data-copied={copied}
      onClick={handleCopy}
      className={className}
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? "check" : "copy"}
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={transition}
          className="inline-flex"
        >
          {copied ? (
            <Check data-icon="icon" aria-hidden="true" />
          ) : (
            <Copy data-icon="icon" aria-hidden="true" />
          )}
        </motion.span>
      </AnimatePresence>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </Button>
  );
}
