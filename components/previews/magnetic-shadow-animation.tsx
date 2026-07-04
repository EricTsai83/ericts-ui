"use client";

import { useState } from "react";

import { LogoIcon } from "@/components/icons";
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
        aria-label="Magnetic shadow heart"
        className="size-28 text-foreground"
        projectedShadowClassName="inset-[12%] text-foreground/20 dark:text-muted/50"
        contactShadowClassName="inset-[12%] text-foreground/30 dark:text-muted/60"
        targetClassName="absolute inset-[12%] text-foreground/90"
      >
        <LogoIcon aria-hidden="true" className="pointer-events-none size-full" />
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
