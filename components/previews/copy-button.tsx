"use client";

import { CopyButton as CssOnlyCopyButton } from "@/registry/base/css-only/copy-button";
import { CopyButton as MotionCopyButton } from "@/registry/base/ui/copy-button";

export default function Preview({ variant }: { variant: string }) {
  const CopyButton =
    variant === "css-only" ? CssOnlyCopyButton : MotionCopyButton;

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
