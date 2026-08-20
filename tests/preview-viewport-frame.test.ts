import { describe, expect, it } from "vitest";

import {
  isPreviewDeviceId,
  previewDeviceHref,
  previewFrameGeometry,
} from "@/components/previews/preview-viewport-frame";

const desktop = { deviceWidth: 1280, deviceHeight: 800 };
const mobile = { deviceWidth: 390, deviceHeight: 844 };

describe("previewFrameGeometry", () => {
  it("leaves a device that fits at its own size", () => {
    expect(
      previewFrameGeometry({ ...desktop, canvasWidth: 1472, canvasHeight: 896 }),
    ).toEqual({ scale: 1, height: 800 });
  });

  it("scales a device down rather than clamping it to the canvas", () => {
    const { scale, height } = previewFrameGeometry({
      ...desktop,
      canvasWidth: 894,
      canvasHeight: 672,
    });

    // The old failure: 894 wide, so the block laid out at 894 and never
    // reached its own desktop breakpoints while the label still said Desktop.
    expect(scale).toBeCloseTo(894 / 1280);
    expect(height).toBe(800);
    expect(Math.round(1280 * scale)).toBe(894);
  });

  it("never grows a device past its own width", () => {
    expect(
      previewFrameGeometry({ ...mobile, canvasWidth: 1472, canvasHeight: 896 })
        .scale,
    ).toBe(1);
  });

  it("gives back the height the canvas has, in the frame's own pixels", () => {
    // A canvas shorter than the phone: the frame takes what is there.
    expect(
      previewFrameGeometry({ ...mobile, canvasWidth: 894, canvasHeight: 672 })
        .height,
    ).toBe(672);

    // Scaled down, the same canvas is worth more of the device's own pixels.
    const { scale, height } = previewFrameGeometry({
      ...desktop,
      canvasWidth: 640,
      canvasHeight: 300,
    });

    expect(scale).toBe(0.5);
    expect(height).toBe(600);
    expect(Math.round(height * scale)).toBe(300);
  });

  it("never takes more of the device's height than the device has", () => {
    // 672 of canvas at 50% would be 1344 of frame; the desktop is 800 tall.
    expect(
      previewFrameGeometry({ ...desktop, canvasWidth: 640, canvasHeight: 672 })
        .height,
    ).toBe(800);
  });

  it("holds still until the canvas has been measured", () => {
    expect(
      previewFrameGeometry({ ...desktop, canvasWidth: 0, canvasHeight: 0 }),
    ).toEqual({ scale: 1, height: 800 });
  });
});

describe("previewDeviceHref", () => {
  it("leaves the default device out of the URL", () => {
    expect(previewDeviceHref("/view/base/deck-lift", "mobile", "mobile")).toBe(
      "/view/base/deck-lift",
    );
  });

  it("carries a non-default device across the route change", () => {
    expect(previewDeviceHref("/view/base/deck-lift", "tablet", "mobile")).toBe(
      "/view/base/deck-lift?w=tablet",
    );
  });

  it("keeps the rest of an existing query", () => {
    expect(
      previewDeviceHref("/view/base/deck-lift?v=css&w=desktop", "tablet", "mobile"),
    ).toBe("/view/base/deck-lift?v=css&w=tablet");

    expect(
      previewDeviceHref("/view/base/deck-lift?v=css&w=desktop", "mobile", "mobile"),
    ).toBe("/view/base/deck-lift?v=css");
  });
});

describe("isPreviewDeviceId", () => {
  it("accepts the devices the toolbar offers and nothing else", () => {
    expect(isPreviewDeviceId("desktop")).toBe(true);
    expect(isPreviewDeviceId("tablet")).toBe(true);
    expect(isPreviewDeviceId("mobile")).toBe(true);
    expect(isPreviewDeviceId("watch")).toBe(false);
  });
});
