"use client";

import { Terminal } from "lucide-react";

import { ReplayablePreview } from "@/components/previews/replayable-preview";
import { TextDecode } from "@/registry/base/ui/text-decode";

export default function Preview() {
  return (
    <ReplayablePreview>
      {(replayKey) => (
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border bg-background shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Terminal className="size-3.5" aria-hidden />
              <span>transmission</span>
            </div>
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
              UTF–8
            </span>
          </div>
          <div className="flex min-h-44 flex-col justify-center gap-4 px-5 sm:px-7">
            <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
              A MESSAGE FOR YOU
            </p>
            <div className="font-mono text-[clamp(1.25rem,4vw,1.75rem)] tracking-tight">
              <span className="mr-3 text-muted-foreground/40" aria-hidden>
                ›
              </span>
              <TextDecode replayKey={replayKey} duration={1100}>
                Hello, human.
              </TextDecode>
            </div>
            <p className="text-xs text-muted-foreground">
              A little noise. Then everything makes sense.
            </p>
          </div>
        </div>
      )}
    </ReplayablePreview>
  );
}
