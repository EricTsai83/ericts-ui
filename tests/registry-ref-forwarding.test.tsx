// @vitest-environment jsdom
import { createRef } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ArcMenu } from "@/registry/base/ui/arc-menu";
import { ChangeHighlight } from "@/registry/base/ui/change-highlight";
import { ContextCursor } from "@/registry/base/ui/context-cursor";
import { DownloadButton } from "@/registry/base/ui/download-button";
import { ExpandablePanel } from "@/registry/base/ui/expandable-panel";
import { ExpandableTabs } from "@/registry/base/ui/expandable-tabs";
import { FloatingShortcutButton } from "@/registry/base/ui/floating-shortcut-button";
import { HighlightTabs } from "@/registry/base/ui/highlight-tabs";
import { IconSwap } from "@/registry/base/ui/icon-swap";
import { RailList } from "@/registry/base/ui/rail-list";
import { RingHud } from "@/registry/base/ui/ring-hud";
import { ScanReveal } from "@/registry/base/ui/scan-reveal";
import { StatusButton } from "@/registry/base/ui/status-button";
import { TextDecode } from "@/registry/base/ui/text-decode";

vi.mock("@/registry/base/ui/ring-hud.css", () => ({}));
vi.mock("@/registry/base/ui/scan-reveal.css", () => ({}));

// jsdom ships no matchMedia; ContextCursor probes for a fine pointer on mount.
beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((media: string) => ({
      matches: false,
      media,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/**
 * Registry items are copied into consumer codebases, so `ref` on the root node
 * is part of their public contract. Components that also keep an
 * internal root ref (outside-click detection, bounds measurement) must *merge*
 * the consumer's ref rather than overwrite it — that is what this guards.
 */
describe("registry root ref forwarding", () => {
  it("forwards a ref to the root node of components with an internal root ref", () => {
    const panelRef = createRef<HTMLElement>();
    const tabsRef = createRef<HTMLDivElement>();
    const cursorRef = createRef<HTMLDivElement>();
    const shortcutRef = createRef<HTMLDivElement>();
    const arcMenuRef = createRef<HTMLDivElement>();

    render(
      <>
        <ExpandablePanel ref={panelRef}>panel</ExpandablePanel>
        <ExpandableTabs
          ref={tabsRef}
          items={[{ id: "a", label: "A", icon: null, onSelect: () => {} }]}
        />
        <ContextCursor ref={cursorRef}>cursor</ContextCursor>
        <FloatingShortcutButton ref={shortcutRef}>
          <span />
        </FloatingShortcutButton>
        <ArcMenu ref={arcMenuRef}>
          <span />
        </ArcMenu>
      </>,
    );

    expect(panelRef.current).toBeInstanceOf(HTMLElement);
    expect(panelRef.current?.dataset.slot).toBe("expandable-panel");

    expect(tabsRef.current).toBeInstanceOf(HTMLDivElement);

    expect(cursorRef.current).toBeInstanceOf(HTMLDivElement);
    expect(cursorRef.current?.dataset.slot).toBe("context-cursor");

    expect(shortcutRef.current).toBeInstanceOf(HTMLDivElement);
    expect(shortcutRef.current?.dataset.slot).toBe("floating-shortcut-button");

    expect(arcMenuRef.current).toBeInstanceOf(HTMLDivElement);
    expect(arcMenuRef.current?.dataset.slot).toBe("arc-menu");
  });

  it("keeps internal behavior working while a consumer ref is attached", () => {
    const panelRef = createRef<HTMLElement>();

    // Outside-click detection reads the same node the consumer ref points at;
    // if the merge dropped the internal ref, this dataset lookup would fail.
    render(<ExpandablePanel ref={panelRef} defaultOpen />);

    expect(panelRef.current?.dataset.state).toBe("open");
  });

  it("forwards refs on components whose props simply spread onto the root", () => {
    const railRef = createRef<HTMLDivElement>();
    const highlightRef = createRef<HTMLDivElement>();
    const buttonRef = createRef<HTMLButtonElement>();
    const iconSwapRef = createRef<HTMLSpanElement>();
    const downloadRef = createRef<HTMLButtonElement>();
    const ringHudRef = createRef<HTMLDivElement>();
    const scanRevealRef = createRef<HTMLDivElement>();
    const textDecodeRef = createRef<HTMLSpanElement>();
    const changeHighlightRef = createRef<HTMLSpanElement>();

    render(
      <>
        <RailList ref={railRef} items={[{ value: "a", label: "A" }]} />
        <HighlightTabs ref={highlightRef} tabs={[{ value: "a", label: "A" }]} />
        <StatusButton ref={buttonRef} />
        <IconSwap
          ref={iconSwapRef}
          active={false}
          icon={<span />}
          activeIcon={<span />}
        />
        <DownloadButton ref={downloadRef} onDownload={() => {}} />
        <RingHud ref={ringHudRef} value={50} />
        <ScanReveal ref={scanRevealRef} before={<span />}>
          <span />
        </ScanReveal>
        <TextDecode ref={textDecodeRef}>text</TextDecode>
        <ChangeHighlight ref={changeHighlightRef} value={1}>
          1
        </ChangeHighlight>
      </>,
    );

    expect(railRef.current?.dataset.slot).toBe("rail-list");
    expect(highlightRef.current?.dataset.slot).toBe("highlight-tabs");
    expect(buttonRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(iconSwapRef.current?.dataset.slot).toBe("icon-swap");
    expect(downloadRef.current?.dataset.slot).toBe("download-button");
    expect(ringHudRef.current?.dataset.slot).toBe("ring-hud");
    expect(scanRevealRef.current?.dataset.slot).toBe("scan-reveal");
    expect(textDecodeRef.current?.dataset.slot).toBe("text-decode");
    expect(changeHighlightRef.current?.dataset.slot).toBe("change-highlight");
  });
});
