"use client";

import { ReplayablePreview } from "@/components/previews/replayable-preview";
import { SqueezeCard } from "@/registry/base/ui/squeeze";

export default function Preview() {
  return (
    <ReplayablePreview>
      {(replayKey) => (
        <SqueezeCard key={replayKey} className="w-full max-w-36" />
      )}
    </ReplayablePreview>
  );
}
