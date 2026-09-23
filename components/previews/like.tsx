"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Like } from "@/registry/base/ui/like";

const FILL_ORIGINS = [
  { label: "Center", origin: undefined },
  { label: "Bottom", origin: "50% 100%" },
  { label: "Top left", origin: "0% 0%" },
  { label: "Right", origin: "100% 50%" },
] as const;

export default function Preview() {
  const [liked, setLiked] = React.useState<boolean[]>(() =>
    FILL_ORIGINS.map(() => false),
  );
  const allLiked = liked.every(Boolean);

  return (
    <div className="flex min-h-40 w-full flex-col items-center justify-center gap-6 py-6">
      <div className="flex items-start gap-8">
        {FILL_ORIGINS.map(({ label, origin }, index) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <Like
              iconSize={40}
              fillOrigin={origin}
              liked={liked[index]}
              onLikedChange={(next) =>
                setLiked((current) =>
                  current.map((value, i) => (i === index ? next : value)),
                )
              }
              likeLabel={`Like, fill from ${label.toLowerCase()}`}
              unlikeLabel={`Unlike, fill from ${label.toLowerCase()}`}
            />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      {/* Toggling every heart at once lines the origins up side by side. */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setLiked(FILL_ORIGINS.map(() => !allLiked))}
      >
        {allLiked ? "Unlike all" : "Like all"}
      </Button>
    </div>
  );
}
