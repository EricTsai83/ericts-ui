import { describe, expect, it } from "vitest";

import { scrollAnchorEasings } from "@/registry/base/hooks/use-scroll-anchor";

const EPSILON = 1e-9;
const SAMPLE_PROGRESSES = Array.from({ length: 11 }, (_, index) => index / 10);

describe("scrollAnchorEasings", () => {
  for (const [name, easing] of Object.entries(scrollAnchorEasings)) {
    describe(name, () => {
      it("starts at 0 and ends at 1", () => {
        expect(easing(0)).toBeCloseTo(0, 9);
        expect(easing(1)).toBeCloseTo(1, 9);
      });

      it("is non-decreasing across the full progress range", () => {
        const values = SAMPLE_PROGRESSES.map((progress) => easing(progress));

        for (let index = 1; index < values.length; index += 1) {
          expect(values[index]).toBeGreaterThanOrEqual(
            values[index - 1] - EPSILON,
          );
        }
      });
    });
  }
});
