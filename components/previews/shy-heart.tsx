"use client";

import { ReplayablePreview } from "@/components/previews/replayable-preview";
import { ShyHeart } from "@/registry/base/ui/shy-heart";

export default function Preview() {
  return (
    <ReplayablePreview>
      {(replayKey) => (
        <div
          key={replayKey}
          className="flex flex-col items-center gap-4"
        >
          <ShyHeart label="Shy heart" size={88} />
          <p className="text-xs text-muted-foreground">
            Hover to make it blush
          </p>
        </div>
      )}
    </ReplayablePreview>
  );
}
