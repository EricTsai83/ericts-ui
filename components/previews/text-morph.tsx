"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { TextMorph } from "@/registry/base/ui/text-morph";

const textMorphWords = ["Typescript", "Next.js", "React", "Convex", "Vercel"];

export default function Preview({ variant }: { variant: string }) {
  const [index, setIndex] = useState(0);
  const activeWord = textMorphWords[index];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % textMorphWords.length);
    }, 2500);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-lg border bg-background px-5 py-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Ship with motion</p>
        <p className="mt-1 font-mono text-4xl font-semibold tracking-normal">
          <TextMorph>{activeWord}</TextMorph>
        </p>
      </div>
      <div className="flex gap-1" aria-hidden="true">
        {textMorphWords.map((word, wordIndex) => (
          <span
            key={word}
            className={cn(
              "size-1.5 rounded-full transition-colors",
              wordIndex === index ? "bg-foreground" : "bg-muted-foreground/25",
            )}
          />
        ))}
      </div>
    </div>
  );
}
