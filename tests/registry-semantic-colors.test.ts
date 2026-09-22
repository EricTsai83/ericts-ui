import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

type Registry = {
  items: Array<{
    name: string;
    type: string;
    files: Array<{ path: string }>;
  }>;
};

/**
 * Registry items are copied into consumer codebases, so a *hue* in their source
 * is a theme decision taken on someone else's behalf: your `zinc-800` is not
 * their neutral, your `#3b82f6` is not their brand, and neither survives their
 * dark mode. That is the bug worth a test.
 *
 * Light is not a theme decision. A specular highlight is white and a drop
 * shadow is black in every theme there is, and a mask's black is not even a
 * colour — it is an alpha channel. So achromatic values are the component's own
 * business and are written literally, in the component, where they can be read
 * and tuned as one stack. The rule this file used to enforce — no colour
 * literals at all — pushed those into `cssVars`, which meant three globals a
 * consumer must not touch and a component that silently lost its shadows if it
 * was copied by hand rather than installed by the CLI.
 *
 * The line is mechanical on purpose. "Does it have a hue" needs no per-file
 * exemption list and no judgement call to litigate in review, which is why this
 * file has no allowlist and should not grow one. Two carve-outs follow from the
 * same principle rather than softening it:
 *
 * - Tailwind's palette is banned whole, greys included, because `bg-zinc-100`
 *   is a *pick from a palette* even when the pick is achromatic; shadcn's
 *   `muted` / `border` / `background` already name what it was for.
 * - `white` and `black` utilities are allowed only with an alpha modifier
 *   (`bg-white/10`), since a translucent one is a scrim and an opaque one is a
 *   surface colour — the dark-mode bug this test exists to catch.
 *
 * Unlike the version this replaces, it reads every registry item. Blocks were
 * silently exempt, which is how `vertical-scene.css` came to hold the very
 * literals the rule forbade — correctly, as it happens: an over-video scrim
 * must not follow the page theme.
 */
const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const UTILITY =
  "bg|text|border|ring|inset-ring|shadow|inset-shadow|outline|divide|from|via|to|fill|stroke|accent|caret|decoration|placeholder";

const PALETTE_UTILITY = new RegExp(`\\b(?:${UTILITY})-(?:${PALETTE})(?:-\\d+)?\\b`);
/** Opaque `bg-white` is a surface colour; `bg-white/10` is a scrim. */
const OPAQUE_BLACK_WHITE = new RegExp(`\\b(?:${UTILITY})-(?:white|black)\\b(?!/)`);
const HEX = /#[0-9a-f]{3,8}\b/gi;
const COLOR_FUNCTION =
  /\b(rgba?|hsla?|oklch|oklab|lab|lch|color)\(\s*([^)]*)\)/gi;
/**
 * A hued CSS keyword, as opposed to `white`, `black`, `transparent`,
 * `currentColor`. Only the Tailwind family names are enumerated, not all 148
 * CSS keywords: in a Tailwind codebase a bare `crimson` is already unusual, and
 * the list is here to catch `color: red`, not to be a parser. Hex and colour
 * functions above are exhaustive, and that is where hues actually arrive.
 */
const NAMED_HUE = new RegExp(`(?:^|[\\s,(:])(?:${PALETTE})(?:$|[\\s,;)])`, "i");
const NAMED_INLINE_HUE = new RegExp(
  `\\b(?:color|backgroundColor|borderColor|outlineColor|fill|stroke|boxShadow|textShadow)\\s*[:=]\\s*["'](?:${PALETTE})["']`,
  "i",
);

function channels(body: string) {
  return body
    .replace(/\/.*$/, "")
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
}

function allEqual(values: string[]) {
  return values.length > 0 && values.every((value) => value === values[0]);
}

/** True when a value carries no hue, and so is light or shadow rather than theme. */
function isAchromatic(value: string, fn?: string, body?: string) {
  if (fn && body !== undefined) {
    const parts = channels(body);

    if (/^rgba?$/i.test(fn)) return allEqual(parts.slice(0, 3));
    if (/^hsla?$/i.test(fn)) return parts[1] === "0" || parts[1] === "0%";
    // oklch / lch: chroma is the second channel.
    if (/^(?:oklch|lch)$/i.test(fn)) return parts[1] === "0";
    // oklab / lab: both opponent channels must vanish.
    if (/^(?:oklab|lab)$/i.test(fn)) return parts[1] === "0" && parts[2] === "0";

    return false;
  }

  const hex = value.slice(1);
  const digits =
    hex.length <= 4
      ? hex.split("").map((digit) => digit + digit)
      : (hex.match(/../g) ?? []);

  return allEqual(digits.slice(0, 3).map((pair) => pair.toLowerCase()));
}

/** Every reason a line can be rejected, so one line is scanned in one place. */
function scanLine(line: string, isCss = false) {
  const reasons: string[] = [];
  // Data URIs carry their own encoded colours and are not theme.
  const code = line.replace(/data:[^"')\s]+/g, "");

  if (PALETTE_UTILITY.test(code)) reasons.push("Tailwind palette colour");
  if (OPAQUE_BLACK_WHITE.test(code)) reasons.push("opaque black/white utility");

  for (const hex of code.match(HEX) ?? []) {
    if (!isAchromatic(hex)) reasons.push(hex);
  }

  for (const [, fn, body] of code.matchAll(COLOR_FUNCTION)) {
    if (!isAchromatic("", fn, body)) reasons.push(`${fn}(${body})`);
  }

  if ((isCss && NAMED_HUE.test(code)) || NAMED_INLINE_HUE.test(code))
    reasons.push("named colour keyword");

  return reasons;
}

describe("registry colour rule", () => {
  it.each([
    'style={{ color: "red" }}',
    "style={{ backgroundColor: 'blue' }}",
    'style={{ borderColor: "teal" }}',
    '<path fill="red" stroke="blue" />',
  ])("rejects inline named hues: %s", (source) => {
    expect(scanLine(source)).toContain("named colour keyword");
  });

  it.each([
    'style={{ color: "currentColor" }}',
    'style={{ boxShadow: "0 1px 2px black" }}',
    'style={{ backgroundColor: "transparent" }}',
    '<path fill="white" />',
    'const label = "red";',
  ])("preserves neutral colours and unrelated strings: %s", (source) => {
    expect(scanLine(source)).toEqual([]);
  });

  it("rejects hues, whatever notation they arrive in", () => {
    expect(scanLine('className="bg-zinc-800"')).not.toEqual([]);
    expect(scanLine('className="text-blue-500 hover:bg-rose-100"')).not.toEqual([]);
    expect(scanLine('className="bg-white"')).not.toEqual([]);
    expect(scanLine('style={{ color: "#3b82f6" }}')).not.toEqual([]);
    expect(scanLine("background: oklch(0.646 0.222 41.116);")).not.toEqual([]);
    expect(scanLine("color: rgb(255 0 0 / 50%);")).not.toEqual([]);
    expect(scanLine("border-color: red;", true)).not.toEqual([]);
    expect(scanLine("background: linear-gradient(to top, teal, transparent);", true)).not.toEqual([]);
  });

  it("passes light and shadow through untouched", () => {
    expect(scanLine("inset 0 1px 1px -0.5px oklch(1 0 0 / 55%)")).toEqual([]);
    expect(scanLine("box-shadow: 0 10px 40px -16px rgb(0 0 0 / 16%);")).toEqual([]);
    expect(scanLine('className="bg-white/10 text-black/60"')).toEqual([]);
    expect(scanLine("mask: radial-gradient(currentColor, transparent);")).toEqual([]);
    expect(scanLine("background: #000;")).toEqual([]);
    expect(scanLine("background: oklch(0.12 0 0);")).toEqual([]);
    expect(scanLine('className="bg-background/25 inset-ring-foreground/12"')).toEqual([]);
  });

  it("keeps hues out of component source, and leaves light and shadow alone", () => {
    const root = process.cwd();
    const registry = JSON.parse(
      readFileSync(path.join(root, "registry.json"), "utf8"),
    ) as Registry;
    const violations: string[] = [];

    for (const item of registry.items) {
      for (const file of item.files) {
        const source = readFileSync(path.join(root, file.path), "utf8");

        source.split("\n").forEach((line, index) => {
          for (const reason of scanLine(line, file.path.endsWith(".css"))) {
            violations.push(`${item.name}: ${file.path}:${index + 1} — ${reason}`);
          }
        });
      }
    }

    expect(
      violations,
      "Hues belong to the consumer's theme: use a shadcn semantic utility or a registry cssVar. Achromatic light and shadow can be written literally.",
    ).toEqual([]);
  });
});
