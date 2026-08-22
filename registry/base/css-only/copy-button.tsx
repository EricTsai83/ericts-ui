"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

import { IconSwap } from "./icon-swap";

type ButtonProps = React.ComponentProps<typeof Button>;
type ButtonClickEvent = Parameters<NonNullable<ButtonProps["onClick"]>>[0];
export type CopyButtonProps = Omit<
  ButtonProps,
  "children" | "value" | "onCopy"
> & {
  /** Text written to the clipboard when the button is pressed. */
  value: string;
  /** How long the copied state stays visible, in ms. */
  copiedDuration?: number;
  /** Icon swap transition duration in milliseconds. Defaults to 160ms. */
  duration?: number;
  /** Called with the copied value after a successful write. */
  onCopy?: (value: string) => void;
};

export function CopyButton({
  value,
  copiedDuration = 1000,
  duration,
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
        return;
      }

      onCopy?.(value);
      setCopied(true);

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), copiedDuration);
    },
    [copiedDuration, onClick, onCopy, value],
  );

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
      <IconSwap
        active={copied}
        duration={duration}
        icon={<Copy />}
        activeIcon={<Check />}
        data-icon="icon"
      />
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </Button>
  );
}
