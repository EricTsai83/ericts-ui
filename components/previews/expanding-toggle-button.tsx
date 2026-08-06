"use client";

import { ScanSearch, X } from "lucide-react";

import { ExpandingToggleButton } from "@/registry/base/ui/expanding-toggle-button";

export default function Preview() {
  return (
    <div className="flex min-h-32 w-full items-center justify-center">
      <ExpandingToggleButton
        icon={<ScanSearch aria-hidden />}
        activeIcon={<X aria-hidden />}
        inactiveLabel="Inspect preview"
        activeLabel="Stop inspecting"
        label="Stop inspecting"
        expandFrom="start"
      />
    </div>
  );
}
