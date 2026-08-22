"use client";

import { Bookmark, Search, Send } from "lucide-react";

import {
  FloatingShortcutAction,
  FloatingShortcutButton,
} from "@/registry/base/ui/floating-shortcut-button";

const actions = [
  { label: "Search", icon: Search },
  { label: "Save", icon: Bookmark },
  { label: "Share", icon: Send },
] as const;

export default function Preview() {
  return (
    <div className="flex min-h-80 w-full items-center justify-center gap-20 pt-6">
      <FloatingShortcutButton triggerCaption="Quick">
        {actions.map(({ label, icon: Icon }) => (
          <FloatingShortcutAction key={label} label={label} icon={<Icon />} />
        ))}
      </FloatingShortcutButton>

      <FloatingShortcutButton
        triggerCaption="Quick"
        triggerLabel="Open icon-only shortcuts"
        showTriggerCaption={false}
      >
        {actions.map(({ label, icon: Icon }) => (
          <FloatingShortcutAction key={label} label={label} icon={<Icon />} />
        ))}
      </FloatingShortcutButton>
    </div>
  );
}
