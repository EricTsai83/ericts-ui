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

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

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
    expect(screen.getAllByText("components/ui/example-item.tsx")).toHaveLength(
      2,
    );
    expect(screen.getByText("components/ui/example-item.css")).toBeTruthy();
    expect(
      screen.getByText(
        "For CSS-only, select the CSS only variant above, then create both files.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText("pnpm add motion lucide-react"),
    ).toBeTruthy();
    expect(screen.getByText("pnpm add lucide-react")).toBeTruthy();
  });
});

describe("ComponentShowcase component guides", () => {
  const navLinkSnippets = [
    {
      name: "sidebar-nav.tsx",
      language: "tsx" as const,
      source: "<NavLink />",
      highlighted: <pre>Sidebar example</pre>,
    },
    {
      name: "match-modes.tsx",
      language: "tsx" as const,
      source: '<NavLink match="prefix" />',
      highlighted: <pre>Match modes example</pre>,
    },
    {
      name: "pending-link.tsx",
      language: "tsx" as const,
      source: "<NavLink>{({ isPending }) => null}</NavLink>",
      highlighted: <pre>Pending example</pre>,
    },
    {
      name: "app/layout.tsx",
      language: "tsx" as const,
      source: "<NavLinkScript />",
      highlighted: <pre>First paint example</pre>,
    },
  ];

  it("renders no guide for an item without one", () => {
    render(
      <ComponentShowcase
        name="example-item"
        codeVariants={[]}
        targetPath="components/ui/example-item.tsx"
      />,
    );

    expect(screen.queryByText("Why not just next/link?")).toBeNull();
  });

  it("frames NavLink as three navigation-state pain points", () => {
    render(
      <ComponentShowcase
        name="nav-link"
        codeVariants={[]}
        targetPath="components/ui/nav-link.tsx"
        guideSnippets={navLinkSnippets}
      />,
    );

    for (const heading of [
      "Why not just next/link?",
      "Link does not know if it is the current location",
      "The current page can also belong to a parent section",
      "A slow navigation gives no feedback",
      "State it exposes",
      "Design notes",
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeTruthy();
    }

    // The sections the earlier draft padded the page with.
    expect(screen.queryByText("How the code maps to those problems")).toBeNull();
    expect(screen.queryByText("Performance and boundaries")).toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("places each guide snippet by name, not by array order", () => {
    render(
      <ComponentShowcase
        name="nav-link"
        codeVariants={[]}
        targetPath="components/ui/nav-link.tsx"
        guideSnippets={[...navLinkSnippets].reverse()}
      />,
    );

    const sections = [
      ["Link does not know if it is the current location", "Sidebar example"],
      ["The current page can also belong to a parent section", "Match modes example"],
      ["A slow navigation gives no feedback", "Pending example"],
      ["Design notes", "First paint example"],
    ] as const;

    for (const [heading, snippet] of sections) {
      const article = screen
        .getByRole("heading", { name: heading })
        .closest("article");

      expect(article).not.toBeNull();
      expect(within(article!).getByText(snippet)).toBeTruthy();
    }
  });

  it("keeps guide prose at full contrast and inline code on a muted chip", () => {
    render(
      <ComponentShowcase
        name="nav-link"
        codeVariants={[]}
        targetPath="components/ui/nav-link.tsx"
        guideSnippets={navLinkSnippets}
      />,
    );

    const prose = screen.getByText(/never reports a wait/);

    expect(prose.className).toContain("text-foreground");
    expect(prose.className).not.toContain("text-muted-foreground");
    expect(
      screen
        .getAllByText("usePathname()")
        .every((term) => term.className.includes("bg-muted")),
    ).toBe(true);
  });
});
