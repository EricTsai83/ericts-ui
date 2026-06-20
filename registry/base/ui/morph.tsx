"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export type MorphProps = Omit<
  React.ComponentPropsWithoutRef<"span">,
  "children"
> & {
  children: string | string[];
};

function getText(children: MorphProps["children"]) {
  return Array.isArray(children) ? children.join("") : children;
}

function generateKeys(text: string) {
  const charCount: Record<string, number> = {};

  return text.split("").map((char) => {
    charCount[char] ??= 0;

    const key = `${char}-${charCount[char]}`;
    charCount[char] += 1;

    return { char, key };
  });
}

export function Morph({ children, className, ...props }: MorphProps) {
  const shouldReduceMotion = useReducedMotion();
  const text = getText(children);
  const textToDisplay = React.useMemo(() => generateKeys(text), [text]);
  const transition = shouldReduceMotion
    ? { duration: 0 }
    : ({
        duration: 0.25,
        type: "spring",
        bounce: 0,
        opacity: {
          duration: 0.35,
          type: "spring",
          bounce: 0,
        },
      } as const);

  return (
    <span aria-label={text} className={cn("inline-block", className)} {...props}>
      <AnimatePresence mode="popLayout" initial={false}>
        {textToDisplay.map(({ char, key }) => (
          <motion.span
            key={key}
            layoutId={shouldReduceMotion ? undefined : key}
            aria-hidden="true"
            className="inline-block text-inherit"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            transition={transition}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
}
