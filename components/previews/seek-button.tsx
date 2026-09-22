"use client";

import { SeekButton } from "@/registry/base/ui/seek-button";

export default function Preview() {
  return (
    <div className="relative flex min-h-56 w-full items-center justify-center overflow-hidden rounded-xl">
      {/* Glass only reads as glass when there is something behind it to
          refract, so the demo lays a soft wash under the controls. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-[30%] top-[20%] size-64 -translate-x-1/2 rounded-full bg-chart-1/45 blur-3xl" />
        <div className="absolute left-[62%] top-[55%] size-64 -translate-x-1/2 rounded-full bg-chart-2/45 blur-3xl" />
        <div className="absolute left-[48%] top-[70%] size-48 -translate-x-1/2 rounded-full bg-chart-4/35 blur-3xl" />
      </div>
      <div className="relative flex items-center gap-12">
        <SeekButton direction="backward" size={72} aria-label="倒退 10 秒" />
        <SeekButton direction="forward" size={72} aria-label="快進 10 秒" />
      </div>
    </div>
  );
}
