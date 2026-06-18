"use client";

import { useId, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { AutoHeight } from "@/registry/base/ui/auto-height";
import { CopyButton } from "@/registry/base/ui/copy-button";
import { SmoothButton } from "@/registry/base/ui/smooth-button";

// Live previews for registry items, keyed by registry name. Items without an
// entry render nothing (the surrounding card still shows their metadata).
const previews: Record<string, ReactNode> = {
  "auto-height": <AutoHeightPreview />,
  "copy-button": <CopyButtonPreview />,
  "smooth-button": <SmoothButtonPreview />,
};

export function RegistryPreview({ name }: { name: string }) {
  return previews[name] ?? null;
}

function CopyButtonPreview() {
  return (
    <div className="flex items-center justify-center">
      <CopyButton
        value="outline"
        variant="outline"
        aria-label="Copy outline variant"
      />
    </div>
  );
}

function AutoHeightPreview() {
  const [isExpanded, setIsExpanded] = useState(false);
  const panelId = useId();

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate text-sm font-medium">Fake Family Drawer</p>
          <p className="text-sm text-muted-foreground">
            {isExpanded ? "Full record" : "Summary"}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-controls={panelId}
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((value) => !value)}
        >
          {isExpanded ? "Collapse" : "Expand"}
        </Button>
      </div>
      <AutoHeight
        id={panelId}
        className="rounded-lg border bg-background"
        innerClassName="p-4"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold">Household profile</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Animating height stays stable because the measured content is
              separated from the animated container.
            </p>
          </div>
          {isExpanded ? (
            <div className="flex flex-col gap-2 border-t pt-3 text-sm text-muted-foreground">
              <p>Primary contact: Nora Lin</p>
              <p>Members: 4 active records</p>
              <p>Last updated: Today</p>
            </div>
          ) : null}
        </div>
      </AutoHeight>
    </div>
  );
}

function SmoothButtonPreview() {
  return (
    <div className="flex items-center justify-center">
      <SmoothButton />
    </div>
  );
}
