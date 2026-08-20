"use client";

import * as React from "react";

import { SlidingPlayButton } from "@/registry/base/ui/sliding-play-button";

export default function Preview() {
  const [playing, setPlaying] = React.useState(false);

  return (
    <div className="flex min-h-40 w-full items-center justify-center">
      <SlidingPlayButton playing={playing} onPlayingChange={setPlaying} />
    </div>
  );
}
