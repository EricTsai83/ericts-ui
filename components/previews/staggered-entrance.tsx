"use client";

import { ReplayablePreview } from "@/components/previews/replayable-preview";
import { StaggeredEntrance } from "@/registry/base/ui/staggered-entrance";

const staggeredEntranceItems = [
  {
    label: "Deploy queued",
    value: "Production",
    meta: "2 min ago",
  },
  {
    label: "Review requested",
    value: "Checkout flow",
    meta: "12 min ago",
  },
  {
    label: "Incident resolved",
    value: "API latency",
    meta: "31 min ago",
  },
];

export default function Preview({ variant }: { variant: string }) {
  return (
    <ReplayablePreview>
      {(replayKey) => (
        <StaggeredEntrance
          key={replayKey}
          items={staggeredEntranceItems}
          getItemKey={(item) => item.label}
          delay={90}
          duration={560}
          distance={12}
          className="flex w-full max-w-md flex-col gap-2"
          renderItem={(item) => (
            <div className="rounded-lg border bg-background px-4 py-3 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.label}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {item.value}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {item.meta}
                </span>
              </div>
            </div>
          )}
        />
      )}
    </ReplayablePreview>
  );
}
