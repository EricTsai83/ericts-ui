"use client";

import { ScanSearch, X } from "lucide-react";

import { ExpandableToggleButton } from "@/registry/base/ui/expandable-toggle-button";

export default function Preview() {
  return (
    <div className="flex min-h-32 w-full items-center justify-center">
      <ExpandableToggleButton
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
