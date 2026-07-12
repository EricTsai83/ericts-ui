// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ComponentShowcase } from "@/components/component-showcase";

vi.mock("next/dynamic", () => ({
  default: () => {
    function DynamicPreview() {
      return null;
    }

    return DynamicPreview;
  },
}));

afterEach(cleanup);

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

  it("guides CSS-only installs through manual copy steps", () => {
    render(
      <ComponentShowcase
        name="example-item"
        codeVariants={[
          {
            value: "motion",
            label: "Motion",
            files: [
              {
                name: "example-item.tsx",
                language: "tsx",
                source: "export function ExampleItem() { return null; }",
              },
            ],
          },
          {
            value: "css-only",
            label: "CSS only",
            files: [
              {
                name: "example-item.css",
                language: "css",
                source: ".example-item {}",
              },
              {
                name: "example-item.tsx",
                language: "tsx",
                source: "import './example-item.css';",
              },
            ],
          },
        ]}
        targetPath="components/ui/example-item.tsx"
        registryDependencies={["button"]}
        dependencies={["motion", "lucide-react"]}
      />,
    );

    expect(
      screen.getByText(
        "This command installs the Motion version. For CSS-only, use Manual and select the CSS only code variant.",
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Manual" }));

    expect(screen.getByText("Copy the source files")).toBeTruthy();
    expect(screen.getByText("components/ui/example-item.tsx")).toBeTruthy();
    expect(
      screen.getByText(
        "For CSS-only, select the CSS only variant above, then copy both the TSX and CSS files.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText("pnpm add motion lucide-react"),
    ).toBeTruthy();
    expect(screen.getByText("pnpm add lucide-react")).toBeTruthy();
  });
});
