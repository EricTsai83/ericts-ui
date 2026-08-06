"use client";

import {
  ScrollExpand,
  ScrollExpandItem,
} from "@/registry/base/blocks/scroll-expand";
import { cn } from "@/lib/utils";

const previewImage = "/images/scroll-expand-watch-hero.png";

export default function Preview({
  presentation = "inline",
}: {
  variant: string;
  presentation?: "inline" | "fullscreen";
}) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-lg border bg-black",
        presentation === "fullscreen"
          ? "h-full min-h-[420px]"
          : "h-[420px]",
      )}
    >
      <ScrollExpand
        src={previewImage}
        alt="Rose-gold mechanical watch on dark stone with its intricate movement exposed"
        direction="focus"
        frameShape="rounded"
        title="What you don't see makes all the difference."
        scrollHint="Look beneath the surface"
        startWidth={38}
        startHeight={64}
        startRadius={16}
        startPosition={{ x: 73, y: 50 }}
        mediaPosition="center"
        mediaTransformOrigin="58% 19%"
        mediaZoom={1.27}
        overlayScrim={0}
        titleAlign="start"
        titleClassName={cn(
          "!right-auto !box-border !w-[clamp(17rem,58cqw,53rem)] !pr-0",
          presentation === "fullscreen"
            ? "!text-[clamp(1.5rem,4.75cqw,4.125rem)]"
            : "!text-[clamp(1.35rem,4.5cqw,3.5rem)]",
        )}
        contentAlign="start"
        contentPosition="center"
        contentLayer="stage"
        className="text-white"
      >
        <div
          className={cn(
            "flex w-[48cqw] flex-col items-start gap-[clamp(.5rem,1cqw,.75rem)]",
            presentation === "fullscreen" ? "max-w-[46cqw]" : "max-w-sm",
          )}
        >
          <ScrollExpandItem start={0.56} end={0.74} offsetY={12}>
            <p className="text-[clamp(.75rem,1cqw,.875rem)] font-medium text-white/75">
              Built from the inside out
            </p>
          </ScrollExpandItem>
          <ScrollExpandItem start={0.62} end={0.84} offsetY={28}>
            <h3
              className={cn(
                "text-balance font-semibold tracking-[-0.03em] text-white",
                presentation === "fullscreen"
                  ? "text-[clamp(1.5rem,4.25cqw,3.75rem)]"
                  : "text-[clamp(1.5rem,4cqw,3.25rem)]",
              )}
            >
              Every detail in its place.
            </h3>
          </ScrollExpandItem>
          <ScrollExpandItem start={0.68} end={0.9} offsetY={24}>
            <p className="max-w-sm text-pretty text-[clamp(.8125rem,1.15cqw,1rem)] leading-[1.5] text-white/85">
              From the smallest gear to the final finish, precision is built
              one considered choice at a time.
            </p>
          </ScrollExpandItem>
        </div>
      </ScrollExpand>
    </div>
  );
}
