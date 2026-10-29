"use client";

import { useState } from "react";
import { ArrowUpRight, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChangeHighlight } from "@/registry/base/ui/change-highlight";

const estimates = [24, 18, 32, 21, 28];

export default function Preview() {
  const [step, setStep] = useState(0);
  const estimate = estimates[step % estimates.length];

  return (
    <div className="flex w-full max-w-72 flex-col items-center gap-5">
      <div className="w-full rounded-2xl border bg-background shadow-sm">
        <div className="flex items-center justify-between px-5 pt-5">
          <p className="text-xs text-muted-foreground">Monthly estimate</p>
          <ArrowUpRight
            className="size-4 text-muted-foreground/60"
            aria-hidden
          />
        </div>
        <div className="px-5 pt-4 pb-6">
          <div aria-live="polite" aria-atomic="true">
            <ChangeHighlight value={step} duration={650} className="rounded-lg">
              <span className="text-4xl font-medium tracking-tighter tabular-nums">
                ${estimate.toFixed(2)}
              </span>
            </ChangeHighlight>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Just enough to notice what changed.
          </p>
        </div>
        <div className="flex items-center justify-between border-t px-5 py-3 text-xs">
          <span className="text-muted-foreground">Usage based</span>
          <span className="flex items-center gap-1.5">
            <span
              className="size-1.5 rounded-full bg-foreground/60"
              aria-hidden
            />
            Live estimate
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setStep((value) => value + 1)}
      >
        <RefreshCw data-icon="inline-start" aria-hidden />
        Recalculate
      </Button>
    </div>
  );
}
