import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  path.join(process.cwd(), "registry/base/ui/jitter.css"),
  "utf8",
);

function keyframesBody(name: string) {
  const start = css.indexOf(`@keyframes ${name} {`);
  expect(start).toBeGreaterThan(-1);
  const end = css.indexOf("\n  }\n", start);
  return css.slice(start, end);
}

/** Evaluates `calc(var(--jitter-<axis>) * <expr>)` for a px custom property. */
function evaluateOffset(term: string, vars: Record<string, number>) {
  const match = term.match(/^calc\(var\((--jitter-[xy])\) \* ([-\d.\s/]+)\)$/);
  if (!match) throw new Error(`Unexpected offset term: ${term}`);
  const [numerator, denominator = "1"] = match[2].split("/");
  return (vars[match[1]] * Number(numerator)) / Number(denominator);
}

describe("jitter.css", () => {
  it("keeps the tuned both-axis path at the default custom properties", () => {
    const body = keyframesBody("jitter-both");
    const defaults = { "--jitter-x": 3, "--jitter-y": 2 };
    const frames = [
      ...body.matchAll(
        /(\d+)% \{\s*transform: translate3d\(\s*(calc\([^;]+?\)),\s*(calc\([^;]+?\)),\s*0\s*\);/g,
      ),
    ].map(([, percent, x, y]) => [
      Number(percent),
      Number(evaluateOffset(x, defaults).toFixed(4)),
      Number(evaluateOffset(y, defaults).toFixed(4)),
    ]);

    // The hand-tuned px values the keyframes previously hard-coded.
    expect(frames).toEqual([
      [8, -3, 1.8],
      [16, 2.7, -1.8],
      [26, -2.4, -1.6],
      [36, 2, 1.34],
      [48, -1.56, 1.04],
      [60, 1.2, -0.8],
      [72, -0.81, -0.54],
      [84, 0.45, 0.3],
      [92, -0.21, 0.14],
    ]);
    expect(body).not.toMatch(/-?\d*\.?\d+px/);
  });

  it("uses the documented both-axis defaults", () => {
    expect(css).toMatch(
      /\[data-axis="both"\] \{\s*--jitter-x: 3px;\s*--jitter-y: 2px;/,
    );
  });
});
