// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DiagramViewport,
  MermaidDiagram,
  type DiagramViewportControls,
} from "@/registry/base/blocks/mermaid-diagram";

const mermaidMocks = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(),
}));

vi.mock("mermaid", () => ({
  default: mermaidMocks,
}));

beforeEach(() => {
  mermaidMocks.initialize.mockReset();
  mermaidMocks.render.mockReset();
  mermaidMocks.render.mockResolvedValue({
    svg: '<svg viewBox="0 0 100 100"><text>Rendered</text></svg>',
  });
  vi.stubGlobal(
    "matchMedia",
    vi.fn(
      () =>
        ({
          matches: false,
          media: "(prefers-reduced-motion: reduce)",
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(() => true),
        }) as MediaQueryList,
    ),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("MermaidDiagram", () => {
  it("treats an empty chart as empty instead of loading forever", () => {
    render(<MermaidDiagram chart={"  \n"} />);

    expect(screen.getByText("No Mermaid source to render.")).toBeTruthy();
    expect(mermaidMocks.render).not.toHaveBeenCalled();
  });

  it("serializes rendering with strict, bounded configuration", async () => {
    render(<MermaidDiagram chart="flowchart LR\nA-->B" />);

    await waitFor(() => expect(screen.getByRole("img")).toBeTruthy());

    expect(mermaidMocks.initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        maxEdges: 500,
        maxTextSize: 50_000,
        securityLevel: "strict",
        startOnLoad: false,
        suppressErrorRendering: true,
      }),
    );
    expect(mermaidMocks.render).toHaveBeenCalledTimes(1);
  });

  it("lets explicit labels override Markdown fence metadata", async () => {
    render(
      <MermaidDiagram
        chart="flowchart LR\nC-->D"
        title="Explicit title"
        caption="Explicit caption"
        meta={'title="Fence title" caption="Fence caption"'}
      />,
    );

    await waitFor(() => expect(screen.getByText("Explicit title")).toBeTruthy());
    expect(screen.queryByText("Fence title")).toBeNull();
  });
});

describe("DiagramViewport", () => {
  it("exposes stable controls and clamps rapid zoom updates", () => {
    const controlsRef = createRef<DiagramViewportControls>();
    const { container } = render(
      <DiagramViewport controlsRef={controlsRef} minZoom={1} maxZoom={1.5} zoomStep={0.25}>
        diagram
      </DiagramViewport>,
    );

    act(() => {
      controlsRef.current?.zoomIn();
      controlsRef.current?.zoomIn();
      controlsRef.current?.zoomIn();
    });

    expect(
      container.querySelector<HTMLElement>("[data-mermaid-viewport-content]")?.style.transform,
    ).toBe("translate(0px, 0px) scale(1.5)");

    act(() => controlsRef.current?.reset());
    expect(
      container.querySelector<HTMLElement>("[data-mermaid-viewport-content]")?.style.transform,
    ).toBe("translate(0px, 0px) scale(1)");
  });
});
