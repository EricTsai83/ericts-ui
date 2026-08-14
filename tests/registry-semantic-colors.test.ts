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

const RAW_TAILWIND_COLOR =
  /(?:bg|text|border|ring|outline|divide|shadow|from|via|to|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-|\/|\b)/;
const RAW_CSS_COLOR =
  /#[\da-f]{3,8}\b|(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\s*\(/i;
const NAMED_COLOR =
  /(?:black|white|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)/;
const RAW_NAMED_CSS_COLOR = new RegExp(
  `(?:^|[\\s,(])${NAMED_COLOR.source}(?:$|[\\s,;)])`,
  "i",
);
const RAW_NAMED_INLINE_COLOR = new RegExp(
  `(?:color|backgroundColor|borderColor|outlineColor|fill|stroke|boxShadow|textShadow)\\s*[:=]\\s*["']${NAMED_COLOR.source}["']`,
  "i",
);

describe("registry UI color theming", () => {
  it("keeps component source free of raw color values", () => {
    const root = process.cwd();
    const registry = JSON.parse(
      readFileSync(path.join(root, "registry.json"), "utf8"),
    ) as Registry;
    const violations: string[] = [];

    for (const item of registry.items) {
      if (item.type !== "registry:ui") continue;

      for (const file of item.files) {
        const source = readFileSync(path.join(root, file.path), "utf8");

        source.split("\n").forEach((line, index) => {
          const hasRawColor =
            RAW_TAILWIND_COLOR.test(line) ||
            RAW_CSS_COLOR.test(line) ||
            RAW_NAMED_INLINE_COLOR.test(line) ||
            (file.path.endsWith(".css") && RAW_NAMED_CSS_COLOR.test(line));

          if (hasRawColor) {
            violations.push(`${item.name}: ${file.path}:${index + 1}`);
          }
        });
      }
    }

    expect(
      violations,
      "Use shadcn semantic utilities or registry cssVars instead of raw colors.",
    ).toEqual([]);
  });
});
