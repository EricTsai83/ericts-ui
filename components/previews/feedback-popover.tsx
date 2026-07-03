"use client";

import { FeedbackPopover } from "@/registry/base/ui/feedback-popover";

export default function Preview({ variant }: { variant: string }) {
  return (
    <div className="flex min-h-72 w-full items-center justify-center">
      <FeedbackPopover className="w-full justify-center [--feedback-popover-width:min(22rem,100%)]" />
    </div>
  );
}
