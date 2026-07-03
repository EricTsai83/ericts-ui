"use client";

import { cn } from "@/lib/utils";

/**
 * Shared fixtures for the use-element-height, use-element-size-map, and
 * use-reduced-motion demos — each renders a segmented control and/or an
 * ease-out transition, so the bits are centralized here instead of
 * duplicated across their demo files.
 */
export const easeOutCubicTuple = [0.215, 0.61, 0.355, 1] as const;

export function DemoSegmentedControl<
  T extends { id: string; label: string },
>({
  label,
  items,
  value,
  onValueChange,
}: {
  label: string;
  items: readonly T[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex flex-wrap justify-center gap-1 rounded-lg border bg-muted/50 p-1"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="radio"
          aria-checked={item.id === value}
          onClick={() => onValueChange(item.id)}
          className={cn(
            "h-8 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors",
            "hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            item.id === value && "bg-background text-foreground shadow-sm",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
