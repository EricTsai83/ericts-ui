// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ExpandablePanel } from "@/registry/base/ui/expandable-panel";

afterEach(cleanup);

describe("ExpandablePanel", () => {
  it("extends the trigger touch target without site-only utilities", () => {
    render(<ExpandablePanel openLabel="Open panel">Body</ExpandablePanel>);

    const trigger = screen.getByRole("button", { name: "Open panel" });

    // `extend-touch-target` is defined in the docs site's globals.css and is
    // not shipped with the registry item, so consumers would silently lose it.
    expect(trigger.classList.contains("extend-touch-target")).toBe(false);
    expect(trigger.classList.contains("absolute")).toBe(true);
    expect(trigger.classList.contains("relative")).toBe(false);
    expect(trigger.className).toContain("pointer-coarse:after:-inset-2");
  });
});
