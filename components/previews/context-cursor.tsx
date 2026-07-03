"use client";

import { ArrowUpRight, Eye, GripHorizontal } from "lucide-react";

import {
  ContextCursor,
  ContextCursorTarget,
  type ContextCursorTargetAnimation,
} from "@/registry/base/ui/context-cursor";

export default function Preview() {
  const largeTargetAnimation = {
    edgeFadeDistance: 40,
    opacity: { hidden: 0, visible: 1 },
    scale: { hidden: 0.4, visible: 1 },
    hideDelay: 150,
  } satisfies ContextCursorTargetAnimation;
  const compactTargetAnimation = {
    edgeFadeDistance: 26,
    opacity: { hidden: 0, visible: 1 },
    scale: { hidden: 0.4, visible: 1 },
    hideDelay: 140,
  } satisfies ContextCursorTargetAnimation;

  return (
    <ContextCursor className="w-full max-w-xl rounded-lg border bg-background p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <ContextCursorTarget
          label="Open"
          variant="open"
          icon={<ArrowUpRight className="size-3.5" aria-hidden />}
          animation={largeTargetAnimation}
          className="rounded-md border bg-muted/40 p-4 transition-colors hover:bg-muted/70"
        >
          <div className="flex min-h-40 flex-col justify-between gap-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">Quarterly report</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Revenue, retention, and activation summary.
                </p>
              </div>
              <span className="rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground">
                PDF
              </span>
            </div>
            <div className="grid grid-cols-5 items-end gap-1.5" aria-hidden>
              {[42, 58, 51, 72, 64].map((height, index) => (
                <span
                  key={index}
                  className="rounded-sm bg-foreground/80"
                  style={{ height }}
                />
              ))}
            </div>
          </div>
        </ContextCursorTarget>

        <div className="flex flex-col gap-3">
          <ContextCursorTarget
            label="Drag"
            variant="drag"
            icon={<GripHorizontal className="size-3.5" aria-hidden />}
            animation={compactTargetAnimation}
            className="flex-1 rounded-md border bg-background p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex h-full items-center gap-3">
              <span
                className="flex size-11 items-center justify-center rounded-md bg-muted text-muted-foreground"
                aria-hidden
              >
                <GripHorizontal className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-medium">Backlog column</p>
                <p className="text-sm text-muted-foreground">
                  Reorder workspace lanes
                </p>
              </div>
            </div>
          </ContextCursorTarget>

          <ContextCursorTarget
            label="Preview"
            variant="preview"
            icon={<Eye className="size-3.5" aria-hidden />}
            animation={compactTargetAnimation}
            className="flex-1 rounded-md border bg-background p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex h-full items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-md border bg-muted/40">
                <Eye className="size-5 text-muted-foreground" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-medium">Design brief</p>
                <p className="text-sm text-muted-foreground">
                  Show a quick file preview
                </p>
              </div>
            </div>
          </ContextCursorTarget>
        </div>
      </div>
    </ContextCursor>
  );
}
