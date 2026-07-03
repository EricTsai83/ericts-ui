"use client";

import {
  Bell,
  FilePlus2,
  FolderPlus,
  Plus,
  Settings,
  Sun,
  UserPlus,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import {
  ExpandableTabs,
  type ExpandableTabItem,
} from "@/registry/base/ui/expandable-tabs";

export default function Preview({ variant }: { variant: string }) {
  const [theme, setTheme] = useState("System");

  const items: ExpandableTabItem[] = [
    {
      id: "create",
      label: "Create",
      icon: <Plus className="size-4" />,
      items: [
        {
          id: "file",
          label: "New file",
          description: "Blank document",
          icon: <FilePlus2 className="size-4" />,
          shortcut: "⌘N",
        },
        {
          id: "folder",
          label: "New folder",
          icon: <FolderPlus className="size-4" />,
        },
        {
          id: "invite",
          label: "Invite teammate",
          icon: <UserPlus className="size-4" />,
        },
      ],
    },
    {
      id: "inbox",
      label: "Inbox",
      icon: <Bell className="size-4" />,
      items: [
        {
          id: "mentions",
          label: "Mentions",
          description: "2 new since yesterday",
        },
        {
          id: "assigned",
          label: "Assigned to you",
          description: "Triage queue",
        },
      ],
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: <Sun className="size-4" />,
      content: (
        <div className="flex w-56 flex-col gap-2 p-1">
          <p className="px-1 text-xs font-medium text-muted-foreground">
            Theme
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {["System", "Light", "Dark"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTheme(option)}
                aria-pressed={theme === option}
                className={cn(
                  "rounded-lg border px-2 py-2 text-xs font-medium transition active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  theme === option
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:bg-foreground/5",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="size-4" />,
      items: [
        {
          id: "account",
          label: "Account",
          description: "Profile and security",
        },
        {
          id: "notifications",
          label: "Notifications",
          description: "Email and push",
        },
        {
          id: "shortcuts",
          label: "Keyboard shortcuts",
          shortcut: "?",
        },
      ],
    },
  ];

  return (
    <div className="flex min-h-80 w-full flex-col items-center justify-end pb-2">
      <ExpandableTabs items={items} aria-label="Workspace quick actions" />
    </div>
  );
}
