"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import "./copy-button.css";

type ButtonProps = React.ComponentProps<typeof Button>;
type ButtonClickEvent = Parameters<NonNullable<ButtonProps["onClick"]>>[0];

export type CopyButtonProps = Omit<
  ButtonProps,
  "children" | "value" | "onCopy"
> & {
  value: string;
  /** How long the copied state stays visible, in ms. */
  copiedDuration?: number;
  onCopy?: (value: string) => void;
};

export function CopyButton({
  value,
  copiedDuration = 1000,
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
  const [interacted, setInteracted] = React.useState(false);
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
      setInteracted(true);
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
      // Same root attribute as the motion variant, so switching between the two
      // doesn't break consumer selectors. (The per-icon `data-state` below is
      // an internal styling hook for the CSS keyframes.)
      data-copied={copied}
      data-interacted={interacted ? "true" : undefined}
      onClick={handleCopy}
      className={cn("copy-button", className)}
      {...props}
    >
      <span className="copy-button__icon-stack" aria-hidden="true">
        <span
          className="copy-button__icon"
          data-state={copied ? "closed" : "open"}
        >
          <Copy data-icon="icon" />
        </span>
        <span
          className="copy-button__icon"
          data-state={copied ? "open" : "closed"}
        >
          <Check data-icon="icon" />
        </span>
      </span>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </Button>
  );
}
