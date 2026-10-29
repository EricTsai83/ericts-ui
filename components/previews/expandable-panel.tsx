"use client";

import { cn } from "@/lib/utils";
import { ExpandablePanel } from "@/registry/base/ui/expandable-panel";

const expandingButtonPreviewGroups = [
  {
    label: "Compose",
    active: false,
    items: [{ label: "Brief" }, { label: "Outline" }, { label: "Copy" }],
  },
  {
    label: "Preview",
    active: true,
    items: [
      { label: "Desktop", active: true },
      { label: "Tablet" },
      { label: "Mobile" },
    ],
  },
  {
    label: "Publish",
    active: false,
    items: [{ label: "Checks" }, { label: "Release" }],
  },
];

export default function Preview() {
  return (
    <div className="relative mx-auto h-80 w-full max-w-xl overflow-hidden rounded-lg border bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] mask-[radial-gradient(circle_at_center,black,transparent_78%)] bg-size-[44px_44px] opacity-35 dark:opacity-20"
      />

      <div className="absolute top-5 left-5 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="size-2 rounded-full bg-primary" aria-hidden />
        Expanding button
      </div>

      <div className="pointer-events-none absolute top-12 right-5 z-10 flex items-end gap-2 text-xs leading-4 font-medium text-foreground/65 italic">
        <span className="mb-1 whitespace-nowrap">Open menu</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 64 86"
          className="h-22 w-16 overflow-visible text-foreground/60"
          fill="none"
        >
          <path
            d="M8 82C42 74 42 30 50 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M39 13 51.5 5 55 19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="relative flex h-full items-center justify-center px-6 text-center">
        <div className="flex max-w-xs flex-col items-center gap-2">
          <p className="text-lg leading-6 font-semibold">A button that grows</p>
        </div>
      </div>

      <ExpandablePanel
        className="absolute top-3 right-3 z-20"
        openLabel="Expand panel"
        closeLabel="Collapse panel"
      >
        <div className="flex min-h-0 flex-1 flex-col py-2.5">
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto pr-(--expandable-panel-trigger-inset) pl-2">
            <div className="flex flex-col gap-1.5">
              {expandingButtonPreviewGroups.map((group) => (
                <section
                  key={group.label}
                  className="flex min-w-0 flex-col gap-0.5"
                >
                  <div
                    className={cn(
                      "px-2 py-1 text-xs leading-4 font-semibold",
                      group.active ? "text-primary" : "text-foreground/70",
                    )}
                  >
                    {group.label}
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    {group.items.map((entry) => (
                      <div
                        key={entry.label}
                        aria-current={
                          "active" in entry && entry.active ? "true" : undefined
                        }
                        className={cn(
                          "flex h-6 min-w-0 items-center rounded-md px-2.5 text-xs",
                          "active" in entry && entry.active
                            ? "bg-muted/55 font-medium text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        <span className="truncate">{entry.label}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </ExpandablePanel>
    </div>
  );
}
