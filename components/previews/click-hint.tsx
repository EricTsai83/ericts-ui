/**
 * Hand-drawn "Click" cue for previews whose affordance is a single small
 * button. Place it inside a `relative` wrapper next to the button: it anchors
 * to the wrapper's left so the sweep lands on the button without covering the
 * glyph that is doing the animating.
 */
export function ClickHint() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-full mr-1 h-16 w-20 -translate-y-1/2 text-xs font-medium italic leading-4 text-foreground/65"
    >
      <span className="absolute top-0 -left-2 whitespace-nowrap">Click</span>
      <svg
        viewBox="0 0 80 64"
        className="absolute inset-0 h-16 w-20 overflow-visible text-foreground/60"
        fill="none"
      >
        {/* Control points sit below the chord, so the sweep dips under the
            label and rises into the button. */}
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
  );
}
