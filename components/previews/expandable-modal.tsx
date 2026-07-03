"use client";

import { ExpandableModal } from "@/registry/base/ui/expandable-modal";

export default function Preview({ variant }: { variant: string }) {
  return (
    <div className="flex min-h-112 w-full items-center justify-center">
      <ExpandableModal className="min-h-112" />
    </div>
  );
}
