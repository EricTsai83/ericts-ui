// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { RegistryInstallCommand } from "@/components/registry-install-command";

describe("RegistryInstallCommand", () => {
  it("switches the displayed command by package manager", () => {
    render(<RegistryInstallCommand name="copy-button" />);

    const pnpmTab = screen.getByRole("tab", { name: "pnpm" });

    expect(pnpmTab.getAttribute("aria-selected")).toBe("true");

    fireEvent.click(screen.getByRole("tab", { name: "npm" }));

    const npmTab = screen.getByRole("tab", { name: "npm" });

    expect(npmTab.getAttribute("aria-selected")).toBe("true");
    expect(
      screen.getByText("npx shadcn@latest add @ericts/copy-button"),
    ).toBeTruthy();
  });

  it("can render the public registry URL fallback command", () => {
    render(<RegistryInstallCommand name="copy-button" mode="url" />);

    expect(
      screen.getByText(
        "pnpm dlx shadcn@latest add https://ui.ericts.com/r/copy-button.json",
      ),
    ).toBeTruthy();
  });
});
