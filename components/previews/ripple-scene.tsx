"use client";

import {
  RippleScene,
  type RippleSceneItem,
} from "@/registry/base/blocks/ripple-scene";
import { cn } from "@/lib/utils";

const scenes: readonly RippleSceneItem[] = [
  {
    value: "field-notes",
    label: "Field notes",
    overline: "Desert passage · Late afternoon",
    title: "Distance sharpens the way home.",
    description:
      "A study in open roads, mineral light, and the few landmarks that turn exposed terrain into a familiar route.",
    image: {
      src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=88",
      alt: "A road winding between red rock formations toward distant mountains",
    },
    imagePosition: "center 52%",
  },
  {
    value: "after-rain",
    label: "After rain",
    overline: "Mountain archive · Study 04",
    title: "The valley keeps the light.",
    description:
      "Clouds lift in layers, revealing a landscape whose depth only becomes visible once the storm has passed.",
    image: {
      src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=88",
      alt: "Dark mountain ridges receding into mist after rainfall",
    },
    imagePosition: "center 45%",
  },
  {
    value: "still-water",
    label: "Still water",
    overline: "Lake district · Blue hour",
    title: "Silence has its own horizon.",
    description:
      "At the edge of daylight, reflections flatten distance and every movement becomes part of the composition.",
    image: {
      src: "https://images.unsplash.com/photo-1439853949127-fa647821eba0?auto=format&fit=crop&w=1800&q=88",
      alt: "A calm alpine lake reflecting mountains at blue hour",
    },
    imagePosition: "center 50%",
  },
  {
    value: "forest-floor",
    label: "Forest floor",
    overline: "Temperate forest · Noon",
    title: "Green begins below the canopy.",
    description:
      "The quieter story is underfoot: moss, fallen branches, and filtered light arranging themselves without a plan.",
    image: {
      src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1800&q=88",
      alt: "Sunlight filtering through a dense green forest",
    },
    imagePosition: "center 48%",
  },
];

export default function Preview({
  presentation = "inline",
}: {
  variant: string;
  presentation?: "inline" | "fullscreen";
}) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden bg-black",
        presentation === "fullscreen"
          ? "h-full min-h-[32rem]"
          : "h-[min(42rem,78svh)] min-h-[34rem] rounded-lg border",
      )}
    >
      <RippleScene
        items={scenes}
        stageLabel="Terrain journal"
        className="h-full"
      />
    </div>
  );
}
