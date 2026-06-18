import type { ReactNode } from "react";

import { CopyButton } from "@/registry/base/ui/copy-button";

// Live previews for registry items, keyed by registry name. Items without an
// entry render nothing (the surrounding card still shows their metadata).
const previews: Record<string, ReactNode> = {
  "copy-button": <CopyButton value="copy-button" />,
};

export function RegistryPreview({ name }: { name: string }) {
  return previews[name] ?? null;
}
