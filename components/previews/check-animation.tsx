"use client";

import { ReplayablePreview } from "@/components/previews/replayable-preview";
import { CheckAnimation } from "@/registry/base/ui/check-animation";

export default function Preview() {
  return (
    <ReplayablePreview>
      {(replayKey) => (
        <div
          key={replayKey}
          className="mx-auto flex w-full max-w-xs items-center justify-center gap-8"
        >
          <CheckAnimation
            variant="square"
            size="lg"
            label="Checked"
            className="text-foreground"
          />
          <CheckAnimation
            variant="circle"
            size="lg"
            label="Verified"
            className="text-primary"
          />
        </div>
      )}
    </ReplayablePreview>
  );
}
