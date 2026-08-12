"use client";

import {
  VerticalScene,
  type VerticalSceneItem,
} from "@/registry/base/blocks/vertical-scene";
import { cn } from "@/lib/utils";

const scenes: readonly VerticalSceneItem[] = [
  {
    value: "passage",
    label: "Passage",
    context: "Red rock country · Late afternoon",
    title: "The road narrows into red stone.",
    description:
      "A long route becomes intimate when the horizon folds into canyon walls and every bend changes the scale of the landscape.",
    image: {
      src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=88",
      alt: "A road winding between red rock formations toward distant mountains",
    },
    imagePosition: "center 52%",
  },
  {
    value: "altitude",
    label: "Altitude",
    context: "Mountain archive · Study 04",
    title: "Cold air carries the whole valley.",
    description:
      "From higher ground, ridgelines become a sequence and the distance between them reads as atmosphere rather than empty space.",
    image: {
      src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=88",
      alt: "A broad mountain valley framed by snowy peaks",
    },
    imagePosition: "center 45%",
  },
  {
    value: "stillness",
    label: "Stillness",
    context: "Lake district · Blue hour",
    title: "Blue hour removes the distance.",
    description:
      "When the surface settles, the reflection stops behaving like an image and begins to feel like another stretch of sky.",
    image: {
      src: "https://images.unsplash.com/photo-1439853949127-fa647821eba0?auto=format&fit=crop&w=1800&q=88",
      alt: "A calm alpine lake reflecting mountains at blue hour",
    },
    imagePosition: "center 50%",
  },
  {
    value: "canopy",
    label: "Canopy",
    context: "Temperate forest · Noon",
    title: "The canopy redraws the sky.",
    description:
      "Light reaches the ground in fragments, turning the path into a changing record of wind moving overhead.",
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
      <VerticalScene
        items={scenes}
        stageLabel="Vertical studies"
        className="h-full"
      />
    </div>
  );
}
