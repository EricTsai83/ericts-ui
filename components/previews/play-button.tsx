"use client";

import * as React from "react";

import { PlayButton } from "@/registry/base/ui/play-button";

export default function Preview() {
  const [playing, setPlaying] = React.useState(false);

  return (
    <div className="flex min-h-40 w-full items-center justify-center">
      <div className="relative flex items-center">
        {/* Anchored to the left of the button so the sweep lands on it without
            covering the glyph that is doing the morphing. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-full mr-1 h-16 w-20 -translate-y-1/2 text-xs font-medium italic leading-4 text-foreground/65"
        >
          <span className="absolute top-0 -left-2 whitespace-nowrap">Click</span>
          <svg
            viewBox="0 0 80 64"
            className="absolute inset-0 h-16 w-20 overflow-visible text-foreground/60"
            fill="none"
          >
            {/* Control points sit below the chord, so the sweep dips under the
                label and rises into the button. */}
            <path
              d="M10 16C30 34 52 38 70 32"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M61 42 70 32 57 29"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <PlayButton playing={playing} onPlayingChange={setPlaying} />
      </div>
    </div>
  );
}
