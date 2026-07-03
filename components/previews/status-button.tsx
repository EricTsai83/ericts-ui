"use client";

import { StatusButton } from "@/registry/base/ui/status-button";

export default function Preview({ variant }: { variant: string }) {
  return (
    <div className="flex items-center justify-center">
      <StatusButton />
    </div>
  );
}
