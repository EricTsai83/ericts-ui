"use client";

import { cn } from "@/lib/utils";
import {
  AdaptiveDrawer,
  type AdaptiveDrawerPanel,
} from "@/registry/base/ui/adaptive-drawer";

export default function Preview({ variant }: { variant: string }) {
  return (
    <AdaptiveDrawer
      title="Adaptive drawer"
      description="Switch panels to watch the drawer resize."
      triggerLabel="Open drawer"
      panels={adaptiveDrawerPanels}
    />
  );
}

const adaptiveDrawerPanels: AdaptiveDrawerPanel[] = [
  {
    id: "compact",
    title: "Compact content",
    description: "A short panel keeps the sheet tight.",
    content: ({ setPanel }) => (
      <AdaptiveDrawerDemoActions activePanel="compact" setPanel={setPanel} />
    ),
  },
  {
    id: "list",
    title: "Taller content",
    description: "More rows make the same drawer grow smoothly.",
    content: ({ setPanel }) => (
      <div className="grid gap-3">
        <AdaptiveDrawerDemoActions activePanel="list" setPanel={setPanel} />
        <div className="grid gap-2">
          {[
            "Design review",
            "Accessibility pass",
            "Motion timing",
            "QA notes",
          ].map((item) => (
            <div
              key={item}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "detail",
    title: "Dense content",
    description: "The drawer adapts again when the content becomes deeper.",
    content: ({ setPanel }) => (
      <div className="grid gap-3">
        <AdaptiveDrawerDemoActions activePanel="detail" setPanel={setPanel} />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 10 }, (_, index) => (
            <div
              key={index}
              className="rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground"
            >
              Item {index + 1}
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

function AdaptiveDrawerDemoActions({
  activePanel,
  setPanel,
}: {
  activePanel: string;
  setPanel?: (panel: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg border bg-muted/40 p-1">
      {adaptiveDrawerPanelOptions.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => setPanel?.(option.id)}
          className={cn(
            "h-8 rounded-md px-2 text-xs font-medium transition-colors",
            activePanel === option.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const adaptiveDrawerPanelOptions = [
  { id: "compact", label: "Small" },
  { id: "list", label: "Medium" },
  { id: "detail", label: "Large" },
];
