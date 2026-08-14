"use client";

import { useState } from "react";

import { ReplayablePreview } from "@/components/previews/replayable-preview";
import { Button } from "@/components/ui/button";
import {
  JitterIcon,
  type JitterIconAxis,
} from "@/registry/base/ui/jitter";

const jitterAxisOptions: {
  label: string;
  value: JitterIconAxis;
}[] = [
  { label: "Horizontal", value: "horizontal" },
  { label: "Vertical", value: "vertical" },
  { label: "Both", value: "both" },
];

export default function Preview() {
  const [axis, setAxis] = useState<JitterIconAxis>("horizontal");

  return (
    <ReplayablePreview>
      {(replayKey) => (
        <div
          key={`${replayKey}-${axis}`}
          className="mx-auto flex w-full max-w-xs flex-col items-center gap-10"
        >
          <div
            role="radiogroup"
            aria-label="Jitter axis"
            className="inline-flex rounded-lg border bg-muted/50 p-1"
          >
            {jitterAxisOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={axis === option.value}
                variant={axis === option.value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setAxis(option.value)}
                className="min-w-20"
              >
                {option.label}
              </Button>
            ))}
          </div>
          <JitterIcon axis={axis} className="w-full max-w-24" />
        </div>
      )}
    </ReplayablePreview>
  );
}
