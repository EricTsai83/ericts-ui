// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StatusBadge } from "@/registry/base/ui/status-badge";

afterEach(cleanup);

describe("StatusBadge", () => {
  it("is a polite live region so status changes are announced", () => {
    render(<StatusBadge status="loading">Saving</StatusBadge>);

    const badge = screen.getByRole("status");

    expect(badge.dataset.slot).toBe("status-badge");
    expect(badge.getAttribute("aria-live")).toBe("polite");
  });

  it("keeps the label in the DOM exactly once", () => {
    render(<StatusBadge status="success">Saved</StatusBadge>);

    // The role lives on the badge itself rather than on an extra sr-only copy,
    // so screen readers never read the label twice.
    expect(screen.getAllByText("Saved")).toHaveLength(1);
  });

  it("can opt out of the live region for decorative use", () => {
    render(
      <StatusBadge status="success" announce={false}>
        Saved
      </StatusBadge>,
    );

    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText("Saved")).toBeTruthy();
  });

  it("lets a consumer override the role", () => {
    render(
      <StatusBadge status="danger" role="alert" aria-live="assertive">
        Failed
      </StatusBadge>,
    );

    expect(screen.getByRole("alert").getAttribute("aria-live")).toBe(
      "assertive",
    );
  });
});
