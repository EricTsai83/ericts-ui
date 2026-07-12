// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ComponentShowcase } from "@/components/component-showcase";

vi.mock("next/dynamic", () => ({
  default: () => {
    function DynamicPreview() {
      return null;
    }

    return DynamicPreview;
  },
}));

describe("ComponentShowcase manual installation", () => {
  it("keeps the package manager picker attached to manual command blocks", () => {
    render(
      <ComponentShowcase
        name="example-item"
        codeVariants={[]}
        targetPath="components/ui/example-item.tsx"
        registryDependencies={["button"]}
        dependencies={["motion"]}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Manual" }));

    const packageManagerTabLists = screen.getAllByRole("tablist", {
      name: "Manual install package manager",
    });

    expect(packageManagerTabLists).toHaveLength(2);

    fireEvent.click(
      within(packageManagerTabLists[0]).getByRole("tab", { name: "npm" }),
    );

    expect(
      within(packageManagerTabLists[0])
        .getByRole("tab", { name: "npm" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(
      within(packageManagerTabLists[1])
        .getByRole("tab", { name: "npm" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(screen.getByText("npx shadcn@latest add button")).toBeTruthy();
    expect(screen.getByText("npm install motion")).toBeTruthy();
  });
});
