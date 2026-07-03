"use client";

import { useState } from "react";

import { HighlightTabs } from "@/registry/base/ui/highlight-tabs";

const highlightTabItems = [
  { value: "overview", label: "Overview" },
  { value: "activity", label: "Activity" },
  { value: "settings", label: "Settings" },
];

export default function Preview() {
  const [activeTab, setActiveTab] = useState(highlightTabItems[0].value);
  const activeLabel =
    highlightTabItems.find((tab) => tab.value === activeTab)?.label ??
    "Overview";

  return (
    <div className="flex flex-col items-center gap-4">
      <HighlightTabs
        tabs={highlightTabItems}
        value={activeTab}
        onValueChange={setActiveTab}
        aria-label="Workspace sections"
      />
      <div className="min-w-64 rounded-lg border bg-background px-4 py-3 text-center">
        <p className="text-sm font-medium">{activeLabel}</p>
        <p className="mt-1 text-xs text-muted-foreground">3 recent changes</p>
      </div>
    </div>
  );
}
