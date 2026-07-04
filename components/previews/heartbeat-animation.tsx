"use client";

import { LogoIcon } from "@/components/icons";
import { ReplayablePreview } from "@/components/previews/replayable-preview";
import { Heartbeat } from "@/registry/base/ui/heartbeat-animation";

export default function Preview() {
  return (
    <ReplayablePreview>
      {(replayKey) => (
        <Heartbeat
          key={replayKey}
          aria-label="Beating heart"
          className="size-32 text-foreground"
          shadowClassName="text-foreground/70 dark:text-muted"
        >
          <LogoIcon className="size-full" />
        </Heartbeat>
      )}
    </ReplayablePreview>
  );
}
