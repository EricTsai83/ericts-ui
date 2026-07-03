"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { useScrollAnchor } from "@/registry/base/hooks/use-scroll-anchor";

const scrollAnchorSections = [
  "Overview",
  "Installation",
  "Quick start",
  "Theming",
  "Design tokens",
  "Layout",
  "Navigation",
  "Overlays",
  "Forms",
  "Feedback",
  "Motion",
  "Data display",
  "Accessibility",
  "Keyboard",
  "Performance",
  "Testing",
  "Deployment",
  "Migration",
  "Changelog",
].map((label, index) => ({
  id: `section-${index}`,
  label,
  meta: `§${index + 1}`,
}));

export default function Preview() {
  const [activeId, setActiveId] = useState(scrollAnchorSections[0].id);
  const { containerRef } = useScrollAnchor<HTMLDivElement>({
    activeKey: activeId,
  });

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3">
      <p className="text-center text-sm text-muted-foreground">
        Pick a section — the selection glides to the upper third of the list.
      </p>
      <div
        ref={containerRef}
        className="no-scrollbar h-64 overflow-y-auto rounded-lg border bg-background p-1.5"
      >
        <div className="flex flex-col gap-1">
          {scrollAnchorSections.map((section) => {
            const active = section.id === activeId;

            return (
              <button
                key={section.id}
                type="button"
                data-scroll-anchor={active ? "" : undefined}
                aria-pressed={active}
                onClick={() => setActiveId(section.id)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <span className="truncate">{section.label}</span>
                <span className="text-xs opacity-70">{section.meta}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
