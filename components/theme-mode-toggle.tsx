"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTheme } from "fumadocs-ui/provider/base";

import { cn } from "@/lib/utils";

type ThemeModeToggleProps = {
  className?: string;
};

const subscribeToHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerSnapshot = () => false;

// A four-point sparkle ("twinkle") centered at (cx, cy) with arm length r.
// The control points pinch back toward the center to carve concave star arms.
function sparklePath(cx: number, cy: number, r: number) {
  const c = r * 0.28;
  return [
    `M${cx} ${cy - r}`,
    `C${cx} ${cy - c} ${cx + c} ${cy} ${cx + r} ${cy}`,
    `C${cx + c} ${cy} ${cx} ${cy + c} ${cx} ${cy + r}`,
    `C${cx} ${cy + c} ${cx - c} ${cy} ${cx - r} ${cy}`,
    `C${cx - c} ${cy} ${cx} ${cy - c} ${cx} ${cy - r}`,
    "Z",
  ].join(" ");
}

// Stars scattered around the moon — kept clear of the r=8 disc and the 24x24
// viewBox edges. Varied sizes and loop periods so they shimmer out of sync,
// like the reference night sky.
const STARS = [
  { cx: 21, cy: 3.6, r: 1.3, period: 2.1 },
  { cx: 3, cy: 5.6, r: 0.95, period: 2.7 },
  { cx: 20.2, cy: 20.4, r: 0.95, period: 2.3 },
] as const;

export function ThemeModeToggle({ className }: ThemeModeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerSnapshot,
  );
  const isDark = resolvedTheme === "dark";
  const clipId = React.useId();
  const blurId = React.useId();
  const glowId = React.useId();
  const haloId = React.useId();
  const sunClipId = React.useId();
  const softId = React.useId();
  const shouldReduceMotion = useReducedMotion();
  const [visualOverride, setVisualOverride] = React.useState<boolean | null>(
    null,
  );
  const visualIsDark = visualOverride ?? isDark;
  const visualOverrideTimer =
    React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttonClassName = cn(
    "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 dark:bg-card",
    className,
  );

  React.useEffect(() => {
    return () => {
      if (visualOverrideTimer.current) {
        clearTimeout(visualOverrideTimer.current);
      }
    };
  }, []);

  const toggleTheme = React.useCallback(() => {
    const nextIsDark = !visualIsDark;

    if (visualOverrideTimer.current) {
      clearTimeout(visualOverrideTimer.current);
    }

    setVisualOverride(nextIsDark);
    visualOverrideTimer.current = setTimeout(() => {
      setVisualOverride(null);
    }, shouldReduceMotion ? 0 : 560);
    setTheme(nextIsDark ? "dark" : "light");
  }, [setTheme, shouldReduceMotion, visualIsDark]);

  // The disc grows from sun core to full moon with a subtle spring. The maria
  // and the sun's highlight share that same spring so they appear together with
  // the disc instead of staggering in. The rays retract to the center on exit.
  const bodyTransition = shouldReduceMotion
    ? { duration: 0 }
    : ({ type: "spring", duration: 0.5, bounce: 0.18 } as const);
  const raysTransition = shouldReduceMotion
    ? { duration: 0 }
    : visualIsDark
      ? ({ duration: 0.18, ease: [0.215, 0.61, 0.355, 1] } as const)
      : ({ duration: 0.32, delay: 0.08, ease: [0.16, 1, 0.3, 1] } as const);
  // The halo blooms outward with a soft ease-out on entry and retracts a touch
  // faster on exit. Stars pop in on a stagger, then twinkle on a slow,
  // out-of-sync easeInOut loop (held static when motion is reduced).
  const glowTransition = shouldReduceMotion
    ? { duration: 0 }
    : visualIsDark
      ? ({ duration: 0.42, ease: [0.215, 0.61, 0.355, 1] } as const)
      : ({ duration: 0.2, ease: [0.4, 0, 1, 1] } as const);
  const getStarTransition = (index: number) =>
    shouldReduceMotion
      ? { duration: 0 }
      : visualIsDark
        ? ({
            duration: STARS[index].period,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.18 + index * 0.14,
          } as const)
        : ({ duration: 0.16, ease: [0.4, 0, 1, 1] } as const);
  // Memoized so the twinkle loop keeps a stable target across the re-renders
  // that fire while toggling (theme settle + override clear) instead of
  // restarting from its first keyframe each time.
  const starAnimate = React.useMemo(
    () =>
      visualIsDark
        ? shouldReduceMotion
          ? { scale: 1, opacity: 0.85 }
          : { scale: [0.55, 1, 0.55], opacity: [0.4, 1, 0.4] }
        : { scale: 0, opacity: 0 },
    [visualIsDark, shouldReduceMotion],
  );

  // Maria (dark patches) on the dark-mode moon disc (centered at 12,12, r=8).
  // Irregular sizes, depths and placement — soft-edged, mostly upper half —
  // to mimic a real full moon rather than neat circular dents.
  const craters = [
    // Top-left mare built from two overlapping lobes so its silhouette reads as
    // an irregular patch rather than a single clean oval. Positions and radii
    // scale with the r=9 disc.
    { cx: 9.64, cy: 8.51, r: 1.69, o: 0.36 },
    { cx: 11.1, cy: 9.53, r: 1.46, o: 0.32 },
    { cx: 13.8, cy: 10.2, r: 1.8, o: 0.34 },
    { cx: 9.3, cy: 12.68, r: 2.03, o: 0.36 },
    { cx: 14.25, cy: 14.25, r: 1.35, o: 0.3 },
    { cx: 11.55, cy: 15.15, r: 1.01, o: 0.28 },
    { cx: 15.15, cy: 8.18, r: 0.9, o: 0.26 },
  ] as const;

  if (!mounted) {
    return (
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        className={buttonClassName}
      >
        <span className="size-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      aria-pressed={visualIsDark}
      className={buttonClassName}
      onClick={toggleTheme}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-5 transition-colors"
      >
        {/* Clip the maria to the moon disc so warped edges stay on the surface. */}
        <clipPath id={clipId}>
          <circle cx="12" cy="12" r="9" />
        </clipPath>
        {/* Warp the maria with low-frequency fractal noise so the perfect
            circles read as irregular, mottled patches, then soften the edges.
            Each patch samples a different part of the shared noise field, so
            they all distort differently without hand-authored shapes. */}
        <filter id={blurId} x="-35%" y="-35%" width="170%" height="170%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.3"
            numOctaves="2"
            seed="2"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="2.8"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="0.3" />
        </filter>
        {/* Sun's gloss highlight: clipped to the sun disc and softly blurred,
            it is the light-mode mirror of the moon's maria. */}
        <clipPath id={sunClipId}>
          <circle cx="12" cy="12" r="6" />
        </clipPath>
        <filter id={softId} x="-80%" y="-80%" width="260%" height="260%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.18"
            numOctaves="2"
            seed="5"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="2.6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="0.55" />
        </filter>
        {/* Soft luminous halo — a broad glow that peaks just outside the disc
            and fades to near-zero before the viewBox edge. */}
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="52%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="78%" stopColor="currentColor" stopOpacity="0.34" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        {/* Warp the halo with very low-frequency noise so its glow is an
            irregular, organic bloom rather than a perfect ring. */}
        <filter id={haloId} x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.06"
            numOctaves="2"
            seed="3"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="4"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Halo: sits behind the disc and blooms outward in dark mode. */}
        <motion.circle
          cx="12"
          cy="12"
          r="12.5"
          fill={`url(#${glowId})`}
          filter={`url(#${haloId})`}
          stroke="none"
          initial={false}
          animate={{ opacity: visualIsDark ? 1 : 0, scale: visualIsDark ? 1 : 0.8 }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          transition={glowTransition}
        />

        {/* The celestial body: a sun core that grows into a full round moon. */}
        <motion.circle
          cx="12"
          cy="12"
          fill="currentColor"
          stroke="none"
          initial={false}
          animate={{ r: visualIsDark ? 9 : 6 }}
          transition={bodyTransition}
        />

        {/* Sun highlight (light mode): a single off-center gloss for a touch of
            dimension, clipped to the disc and grown in with it. */}
        <g clipPath={`url(#${sunClipId})`} filter={`url(#${softId})`}>
          <motion.circle
            cx="10.3"
            cy="10.3"
            fill="var(--background)"
            fillOpacity={0.55}
            stroke="none"
            initial={false}
            animate={{ r: visualIsDark ? 0 : 1.8 }}
            transition={bodyTransition}
          />
        </g>

        {/* Maria: flat, soft-edged dark patches that tint the surface toward the
            background, warped into irregular shapes and grown in with the moon. */}
        <g clipPath={`url(#${clipId})`} filter={`url(#${blurId})`}>
          {craters.map((crater, index) => (
            <motion.circle
              key={index}
              cx={crater.cx}
              cy={crater.cy}
              fill="var(--background)"
              fillOpacity={crater.o}
              stroke="none"
              initial={false}
              animate={{ r: visualIsDark ? crater.r : 0 }}
              transition={bodyTransition}
            />
          ))}
        </g>

        {/* Stars: four-point sparkles that pop in on a stagger, then twinkle. */}
        {STARS.map((star, index) => (
          <motion.path
            key={index}
            d={sparklePath(star.cx, star.cy, star.r)}
            fill="currentColor"
            stroke="none"
            initial={false}
            animate={starAnimate}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            transition={getStarTransition(index)}
          />
        ))}

        {/* Sun rays — symmetric around the center, retract inward in dark mode. */}
        <motion.g
          initial={false}
          animate={{
            opacity: visualIsDark ? 0 : 1,
            scale: visualIsDark ? 0.5 : 1,
            rotate: visualIsDark ? -40 : 0,
          }}
          style={{
            transformBox: "fill-box",
            transformOrigin: "center",
          }}
          transition={raysTransition}
        >
          <line x1="19.5" y1="12" x2="22.5" y2="12" />
          <line x1="17.3" y1="6.7" x2="19.42" y2="4.58" />
          <line x1="12" y1="4.5" x2="12" y2="1.5" />
          <line x1="6.7" y1="6.7" x2="4.58" y2="4.58" />
          <line x1="4.5" y1="12" x2="1.5" y2="12" />
          <line x1="6.7" y1="17.3" x2="4.58" y2="19.42" />
          <line x1="12" y1="19.5" x2="12" y2="22.5" />
          <line x1="17.3" y1="17.3" x2="19.42" y2="19.42" />
        </motion.g>
      </svg>
    </button>
  );
}
