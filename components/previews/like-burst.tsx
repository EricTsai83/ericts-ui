"use client";

import { ClickHint } from "@/components/previews/click-hint";
import { LikeBurst } from "@/registry/base/ui/like-burst";

export default function Preview() {
  return (
    <div className="flex min-h-40 w-full items-center justify-center">
      <div className="relative flex items-center">
        <ClickHint />
        <LikeBurst iconSize={40} />
      </div>
    </div>
  );
}
