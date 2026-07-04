"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

import { ReplayablePreview } from "@/components/previews/replayable-preview";
import { Button } from "@/components/ui/button";
import { MagneticShadow } from "@/registry/base/ui/magnetic-shadow-animation";

export default function Preview() {
  return (
    <ReplayablePreview>
      {(replayKey) => <MagneticShadowPreview key={replayKey} />}
    </ReplayablePreview>
  );
}

function MagneticShadowPreview() {
  const [active, setActive] = useState(false);

  return (
    <div className="flex w-full flex-col items-center gap-7">
      <MagneticShadow
        active={active}
        aria-label="Magnetic shadow sparkles"
        className="size-28 text-foreground"
        projectedShadowClassName="text-foreground/20 dark:text-muted/50"
        contactShadowClassName="text-foreground/30 dark:text-muted/60"
      >
        <span className="flex size-full items-center justify-center rounded-2xl border border-current/15 bg-current/[0.045]">
          <Sparkles aria-hidden="true" className="size-12" />
        </span>
      </MagneticShadow>

      <Button
        type="button"
        variant={active ? "secondary" : "outline"}
        size="sm"
        aria-pressed={active}
        onClick={() => setActive((current) => !current)}
      >
        {active ? "Release" : "Gather"}
      </Button>
    </div>
  );
}
