"use client";

import { ReplayablePreview } from "@/components/previews/replayable-preview";
import { SqueezeAnimation } from "@/registry/base/ui/squeeze-animation";

export default function Preview() {
  return (
    <ReplayablePreview>
      {(replayKey) => (
        <SqueezeAnimation key={replayKey} className="w-full max-w-36" />
      )}
    </ReplayablePreview>
  );
}
