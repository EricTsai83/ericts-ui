"use client";

import { FileText, Folder, Image as ImageIcon } from "lucide-react";

import { ArcMenu, ArcMenuAction } from "@/registry/base/ui/arc-menu";

const actions = [
  { label: "New document", icon: FileText },
  { label: "Add image", icon: ImageIcon },
  { label: "Open folder", icon: Folder },
] as const;

export default function Preview() {
  return (
    <div className="flex min-h-80 w-full items-center justify-center gap-28 pt-24">
      <ArcMenu triggerCaption="Quick">
        {actions.map(({ label, icon: Icon }) => (
          <ArcMenuAction key={label} label={label} icon={<Icon />} />
        ))}
      </ArcMenu>

      <ArcMenu
        triggerCaption="Quick"
        triggerLabel="Open icon-only shortcuts"
        showTriggerCaption={false}
      >
        {actions.map(({ label, icon: Icon }) => (
          <ArcMenuAction key={label} label={label} icon={<Icon />} />
        ))}
      </ArcMenu>
    </div>
  );
}
