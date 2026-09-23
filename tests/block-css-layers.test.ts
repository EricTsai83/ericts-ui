import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readBlockCss(name: string) {
  return readFileSync(
    path.join(process.cwd(), `registry/base/blocks/${name}.css`),
    "utf8",
  );
}

/** Splits a stylesheet into its `@layer components` body and everything else. */
function splitLayer(css: string) {
  const start = css.indexOf("@layer components {");
  expect(start).toBeGreaterThan(-1);

  let depth = 0;
  let end = -1;

  for (let index = css.indexOf("{", start); index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") depth -= 1;
    if (depth === 0) {
      end = index;
      break;
    }
  }

  expect(end).toBeGreaterThan(start);

  return {
    layered: css.slice(start, end + 1),
    unlayered: css.slice(0, start) + css.slice(end + 1),
  };
}

describe("block stylesheets", () => {
  it.each(["scroll-expand", "ripple-scene", "vertical-scene"])(
    "layers %s defaults so consumer utilities can override them",
    (name) => {
      const { layered, unlayered } = splitLayer(readBlockCss(name));

      expect(layered).toContain(`.${name} {`);
      expect(unlayered).not.toContain(`.${name} {`);
      expect(unlayered).not.toContain(`.${name}__chrome`);
      expect(unlayered).not.toContain(`.${name}__title {`);
    },
  );

  it.each([
    ["ripple-scene", [".ripple-scene__tab {", ".ripple-scene__tab-indicator {"]],
    [
      "vertical-scene",
      [
        '.vertical-scene__selector [data-slot="sliding-list-list"]',
        ".vertical-scene__selector .vertical-scene__tab {",
        ".vertical-scene__selector .vertical-scene__tab:focus-visible",
      ],
    ],
  ])(
    "keeps %s selector restyles above the list's own utilities",
    (name, selectors) => {
      const { layered, unlayered } = splitLayer(readBlockCss(name));

      for (const selector of selectors) {
        expect(unlayered).toContain(selector);
        expect(layered).not.toContain(selector);
      }
    },
  );

  it("keeps scroll-expand reduced-motion guards outside the layer", () => {
    const { layered, unlayered } = splitLayer(readBlockCss("scroll-expand"));

    expect(layered).not.toContain("prefers-reduced-motion");
    expect(unlayered).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
