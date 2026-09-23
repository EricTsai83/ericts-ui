"use client";

import * as React from "react";

import { ClickHint } from "@/components/previews/click-hint";
import { PlayButton } from "@/registry/base/ui/play-button";

export default function Preview() {
  const [playing, setPlaying] = React.useState(false);

  return (
    <div className="flex min-h-40 w-full items-center justify-center">
      <div className="relative flex items-center">
        <ClickHint />
        <PlayButton playing={playing} onPlayingChange={setPlaying} />
      </div>
    </div>
  );
}
