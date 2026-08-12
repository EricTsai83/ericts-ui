"use client";

import {
  ChevronsLeft,
  ChevronsLeftRight,
  ChevronsRight,
  ChevronsRightLeft,
  FilePlus2,
  FolderPlus,
  Mail,
  UserPlus,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ExpandableToolbar } from "@/registry/base/ui/expandable-toolbar";

type ToolbarSide = NonNullable<ComponentProps<typeof ExpandableToolbar>["side"]>;

const DEMOS: {
  side: ToolbarSide;
  caption: string;
  expandIcon: ReactNode;
  collapseIcon: ReactNode;
}[] = [
  {
    side: "start",
    caption: 'side="start" — grows left',
    expandIcon: <ChevronsLeft aria-hidden />,
    collapseIcon: <ChevronsRight aria-hidden />,
  },
  {
    side: "center",
    caption: 'side="center" — grows both ways',
    expandIcon: <ChevronsLeftRight aria-hidden />,
    collapseIcon: <ChevronsRightLeft aria-hidden />,
  },
  {
    side: "end",
    caption: 'side="end" — grows right',
    expandIcon: <ChevronsRight aria-hidden />,
    collapseIcon: <ChevronsLeft aria-hidden />,
  },
];

// Returned as an array (not a fragment): side="center" splits the toolbar's
// direct children between its two panels, and a fragment would arrive as a
// single child.
function toolbarActions() {
  return [
    <Button
      key="file"
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="New file"
    >
      <FilePlus2 aria-hidden />
    </Button>,
    <Button
      key="folder"
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="New folder"
    >
      <FolderPlus aria-hidden />
    </Button>,
    <Button
      key="invite"
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Invite teammate"
    >
      <UserPlus aria-hidden />
    </Button>,
    <Button
      key="mail"
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Send invite"
    >
      <Mail aria-hidden />
    </Button>,
  ];
}

export default function Preview() {
  return (
    <div className="flex min-h-72 w-full flex-col items-center justify-center gap-9">
      {DEMOS.map(({ side, caption, expandIcon, collapseIcon }) => (
        <div key={side} className="flex flex-col items-center gap-2.5">
          {/* anchor="trigger" keeps each row's layout fixed while the toolbar
              overlays outward in its own direction. */}
          <ExpandableToolbar
            side={side}
            anchor="trigger"
            expandIcon={expandIcon}
            collapseIcon={collapseIcon}
            expandLabel={`Show quick actions (${side})`}
            collapseLabel={`Hide quick actions (${side})`}
          >
            {toolbarActions()}
          </ExpandableToolbar>
          <p className="font-mono text-[11px] font-medium text-muted-foreground">
            {caption}
          </p>
        </div>
      ))}
    </div>
  );
}
