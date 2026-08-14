"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "motion/react";

import { cn } from "@/lib/utils";

export type TextMorphProps = Omit<
  React.ComponentProps<"span">,
  "children"
> & {
  children: string | string[];
  /** Overrides the default morph transition. Ignored when motion is reduced. */
  transition?: Transition;
};

const DEFAULT_TRANSITION = {
  duration: 0.25,
  type: "spring",
  bounce: 0,
  opacity: {
    duration: 0.35,
    type: "spring",
    bounce: 0,
  },
} as const;

function getText(children: TextMorphProps["children"]) {
  return Array.isArray(children) ? children.join("") : children;
}

function generateKeys(text: string) {
  const charCount: Record<string, number> = {};

  // Iterate code points rather than UTF-16 units so surrogate pairs (emoji,
  // astral-plane characters) are never split across two spans.
  return Array.from(text).map((char) => {
    charCount[char] ??= 0;

    const key = `${char}-${charCount[char]}`;
    charCount[char] += 1;

    return { char, key };
  });
}

export function TextMorph({
  children,
  className,
  transition: transitionProp,
  ...props
}: TextMorphProps) {
  const uid = React.useId();
  const shouldReduceMotion = useReducedMotion();
  const text = getText(children);
  const textToDisplay = React.useMemo(() => generateKeys(text), [text]);
  const transition = shouldReduceMotion
    ? { duration: 0 }
    : (transitionProp ?? DEFAULT_TRANSITION);

  return (
    <span className={cn("inline-block", className)} {...props}>
      {/* Per-character spans are aria-hidden; this is the accessible text. */}
      <span className="sr-only">{text}</span>
      <AnimatePresence mode="popLayout" initial={false}>
        {textToDisplay.map(({ char, key }) => (
          <motion.span
            key={key}
            layoutId={shouldReduceMotion ? undefined : `${uid}-${key}`}
            aria-hidden="true"
            className="inline-block text-inherit"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            transition={transition}
          >
            {char === " " ? " " : char}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
}
