"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import "./copy-button.css";

type ButtonProps = React.ComponentPropsWithoutRef<typeof Button>;
type ButtonClickEvent = Parameters<NonNullable<ButtonProps["onClick"]>>[0];

export type CopyButtonProps = Omit<
  ButtonProps,
  "children" | "value" | "onCopy"
> & {
  value: string;
  timeout?: number;
  onCopy?: (value: string) => void;
};

export function CopyButton({
  value,
  timeout = 1000,
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
      timer.current = setTimeout(() => setCopied(false), timeout);
    },
    [onClick, onCopy, timeout, value],
  );

  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      aria-label={ariaLabel}
      data-state={copied ? "open" : "closed"}
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
