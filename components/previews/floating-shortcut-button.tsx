"use client";

import { Bookmark, Search, Send } from "lucide-react";

import {
  FloatingShortcutAction,
  FloatingShortcutButton,
} from "@/registry/base/ui/floating-shortcut-button";

export default function Preview() {
  return (
    <div className="flex min-h-80 w-full items-center justify-center pt-6">
      <FloatingShortcutButton defaultOpen triggerCaption="Quick">
        <FloatingShortcutAction label="Search" icon={<Search />} />
        <FloatingShortcutAction label="Save" icon={<Bookmark />} />
        <FloatingShortcutAction label="Share" icon={<Send />} />
      </FloatingShortcutButton>
    </div>
  );
}
