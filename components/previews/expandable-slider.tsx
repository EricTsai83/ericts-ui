"use client";

import * as React from "react";
import { Volume1, Volume2, VolumeX } from "lucide-react";

import {
  ExpandableSlider,
  ExpandableSliderTrack,
  ExpandableSliderTrigger,
} from "@/registry/base/ui/expandable-slider";

export default function Preview() {
  const [volume, setVolume] = React.useState(70);
  const [restoreVolume, setRestoreVolume] = React.useState(70);
  const muted = volume === 0;
  const VolumeIcon = muted ? VolumeX : volume < 50 ? Volume1 : Volume2;

  const handleVolumeChange = (next: number) => {
    setVolume(next);

    if (next > 0) {
      setRestoreVolume(next);
    }
  };

  const toggleMute = () => {
    if (muted) {
      setVolume(restoreVolume || 50);
      return;
    }

    setRestoreVolume(volume);
    setVolume(0);
  };

  return (
    <div className="flex min-h-40 w-full items-center justify-center">
      <div className="relative flex items-center">
        {/* Anchored to the left of the trigger so it never sits in the space
            the track grows into. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-full mr-1 h-16 w-20 -translate-y-1/2 text-xs font-medium italic leading-4 text-foreground/65"
        >
          <span className="absolute top-0 -left-2 whitespace-nowrap">Hover</span>
          <svg
            viewBox="0 0 80 64"
            className="absolute inset-0 h-16 w-20 overflow-visible text-foreground/60"
            fill="none"
          >
            {/* Control points sit below the chord, so the sweep dips under the
                label and rises into the trigger. */}
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

        <ExpandableSlider
          label="Volume"
          value={volume}
          onValueChange={handleVolumeChange}
          formatValueText={(value) => `${value}%`}
        >
          <ExpandableSliderTrigger
            aria-label={muted ? "Unmute" : "Mute"}
            onClick={toggleMute}
          >
            <VolumeIcon />
          </ExpandableSliderTrigger>
          <ExpandableSliderTrack />
        </ExpandableSlider>
      </div>
    </div>
  );
}
