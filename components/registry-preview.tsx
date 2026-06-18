import type { ReactNode } from "react";

import { CopyButton } from "@/registry/base/ui/copy-button";

const INSTALL_COMMAND = "npx shadcn@latest add copy-button";

// Live previews for registry items, keyed by registry name. Items without an
// entry render nothing (the surrounding card still shows their metadata).
const previews: Record<string, ReactNode> = {
  "copy-button": (
    <div className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5">
      <code className="px-1 text-sm text-muted-foreground">
        {INSTALL_COMMAND}
      </code>
      <CopyButton value={INSTALL_COMMAND} className="size-7" />
    </div>
  ),
};

export function RegistryPreview({ name }: { name: string }) {
  return previews[name] ?? null;
}
