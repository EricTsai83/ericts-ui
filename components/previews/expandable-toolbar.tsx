"use client";

import {
  ChevronsLeft,
  ChevronsRight,
  FilePlus2,
  FolderPlus,
  Mail,
  UserPlus,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ExpandableToolbar } from "@/registry/base/ui/expandable-toolbar";

export default function Preview({ variant }: { variant: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-32 w-full items-center justify-center">
      <ExpandableToolbar
        open={open}
        onOpenChange={setOpen}
        side="start"
        anchor="trigger"
        expandIcon={<ChevronsLeft aria-hidden />}
        collapseIcon={<ChevronsRight aria-hidden />}
        expandLabel="Show quick actions"
        collapseLabel="Hide quick actions"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="New file"
        >
          <FilePlus2 aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="New folder"
        >
          <FolderPlus aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Invite teammate"
        >
          <UserPlus aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Send invite"
        >
          <Mail aria-hidden />
        </Button>
      </ExpandableToolbar>
    </div>
  );
}
