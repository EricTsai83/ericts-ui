"use client";

import { CopyButton } from "@/registry/base/ui/copy-button";

export default function Preview() {
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
