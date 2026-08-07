"use client";

import { ArrowDown, ArrowUp, Accessibility } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import {
  ScrollExpand,
  ScrollExpandItem,
} from "@/registry/base/blocks/scroll-expand";
import { useReducedMotion } from "@/registry/base/hooks/use-reduced-motion";
import { StatusBadge } from "@/registry/base/ui/status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const previewImage = "/images/scroll-expand-watch-hero.png";
type ScrollDirection = "down" | "up";

export default function Preview({
  presentation = "inline",
}: {
  variant: string;
  presentation?: "inline" | "fullscreen";
}) {
  const [scrollDirection, setScrollDirection] =
    useState<ScrollDirection>("down");
  const scrollDirectionRef = useRef<ScrollDirection>("down");
  const [playAnyway, setPlayAnyway] = useState(false);
  const systemReducedMotion = useReducedMotion();
  const motionPaused = systemReducedMotion && !playAnyway;

  const handleProgress = useCallback((progress: number) => {
    const currentDirection = scrollDirectionRef.current;
    const nextDirection =
      currentDirection === "down"
        ? progress >= 0.92
          ? "up"
          : "down"
        : progress <= 0.08
          ? "down"
          : "up";

    if (nextDirection === currentDirection) {
      return;
    }

    scrollDirectionRef.current = nextDirection;
    setScrollDirection(nextDirection);
  }, []);

  const shouldScrollDown = scrollDirection === "down";

  return (
    <div
      className={cn(
        "relative w-full",
        presentation === "fullscreen" && "h-full",
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-lg border bg-black",
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
          startWidth={38}
          startHeight={64}
          startRadius={16}
          startPosition={{ x: 73, y: 50 }}
          focalPoint={{ x: 70, y: 43 }}
          mediaZoom={1.27}
          overlayScrim={0}
          titleAlign="start"
          titleClassName={cn(
            "!right-auto !box-border !w-[clamp(17rem,58cqw,53rem)] !pr-0",
            // A compact stage keeps the same side-by-side composition; it only
            // drops the `17rem` floor, which on its own is wider than a phone
            // and is what used to force the headline to full width.
            "group-data-[size=compact]:!w-[58cqw]",
            "group-data-[size=compact]:!text-[clamp(1.125rem,5.6cqw,2rem)]",
            // Anchored low so the headline hands off to the copy in place, the
            // way the desktop pair does at the vertical centre.
            "group-data-[size=compact]:!items-end group-data-[size=compact]:!pb-[8%]",
            presentation === "fullscreen"
              ? "!text-[clamp(1.5rem,4.75cqw,4.125rem)]"
              : "!text-[clamp(1.35rem,4.5cqw,3.5rem)]",
          )}
          contentAlign="start"
          contentPosition="center"
          contentLayer="stage"
          compact={{
            // A phone stage is far taller than it is wide, so rather than shrink
            // the desktop's centred side-by-side it goes diagonal: the frame
            // climbs to the top-right as a tall card and the copy drops to the
            // bottom-left. Its left edge (78 - 42/2 = 57%) is the hard limit the
            // copy column has to clear.
            startWidth: 42,
            startHeight: 52,
            startPosition: { x: 78, y: 34 },
            startRadius: 22,
            contentPosition: "bottom",
            mediaZoom: 1.16,
            scrollDistance: 0.85,
          }}
          respectReducedMotion={!playAnyway}
          className="group text-white"
          onProgress={handleProgress}
        >
          <div
            className={cn(
              "flex w-[48cqw] flex-col items-start gap-[clamp(.5rem,1cqw,.75rem)]",
              // 6% overlay padding + 46cqw leaves a 5% gutter before the frame.
              "group-data-[size=compact]:w-[46cqw] group-data-[size=compact]:max-w-none",
              presentation === "fullscreen" ? "max-w-[46cqw]" : "max-w-sm",
            )}
          >
            <ScrollExpandItem start={0.56} end={0.74} offsetY={12}>
              <p className="text-[clamp(.75rem,1cqw,.875rem)] font-medium text-white/75 group-data-[size=compact]:text-[.8125rem]">
                Built from the inside out
              </p>
            </ScrollExpandItem>
            <ScrollExpandItem start={0.62} end={0.84} offsetY={28}>
              <h3
                className={cn(
                  "text-balance font-semibold tracking-[-0.03em] text-white",
                  "group-data-[size=compact]:text-[clamp(1.05rem,5.2cqw,1.75rem)]",
                  presentation === "fullscreen"
                    ? "text-[clamp(1.5rem,4.25cqw,3.75rem)]"
                    : "text-[clamp(1.5rem,4cqw,3.25rem)]",
                )}
              >
                Every detail in its place.
              </h3>
            </ScrollExpandItem>
            <ScrollExpandItem start={0.68} end={0.9} offsetY={24}>
              <p className="max-w-sm text-pretty text-[clamp(.8125rem,1.15cqw,1rem)] leading-[1.5] text-white/85 group-data-[size=compact]:max-w-none group-data-[size=compact]:text-[.8125rem]">
                From the smallest gear to the final finish, precision is built
                one considered choice at a time.
              </p>
            </ScrollExpandItem>
          </div>
        </ScrollExpand>
        {motionPaused ? (
          // Without this the demo just looks broken to anyone running the OS
          // preference, so the preview names the mode and offers a way past it.
          <div className="absolute right-3 bottom-3 flex items-center gap-2 sm:right-4 sm:bottom-4">
            <StatusBadge
              status="info"
              size="sm"
              icon={<Accessibility className="size-3" />}
              role="status"
              aria-live="polite"
            >
              Reduced motion
            </StatusBadge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 rounded-full bg-background/80 px-2.5 text-[11px] backdrop-blur-sm"
              onClick={() => setPlayAnyway(true)}
            >
              Play anyway
            </Button>
          </div>
        ) : (
          <StatusBadge
            status="neutral"
            size="sm"
            icon={
              shouldScrollDown ? (
                <ArrowDown className="size-3" />
              ) : (
                <ArrowUp className="size-3" />
              )
            }
            contentKey={scrollDirection}
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute right-3 bottom-3 sm:right-4 sm:bottom-4"
          >
            {shouldScrollDown ? "Scroll down" : "Scroll up"}
          </StatusBadge>
        )}
      </div>
    </div>
  );
}
