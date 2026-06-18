import type { ReactNode } from "react";

import { CopyButton } from "@/registry/base/ui/copy-button";
import { SmoothButton } from "@/registry/base/ui/smooth-button";

// Live previews for registry items, keyed by registry name. Items without an
// entry render nothing (the surrounding card still shows their metadata).
const previews: Record<string, ReactNode> = {
  "copy-button": <CopyButtonPreview />,
  "smooth-button": <SmoothButtonPreview />,
};

export function RegistryPreview({ name }: { name: string }) {
  return previews[name] ?? null;
}

function CopyButtonPreview() {
  return (
    <div className="flex items-center justify-center">
      <CopyButton
        value="outline"
        variant="outline"
        aria-label="Copy outline variant"
      />
    </div>
  );
}

function SmoothButtonPreview() {
  return (
    <div className="flex items-center justify-center">
      <SmoothButton />
    </div>
  );
}
