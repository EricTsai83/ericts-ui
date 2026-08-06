"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { XIcon, ZoomInIcon } from "lucide-react";

import styles from "@/components/surface-grain-demo.module.css";
import { cn } from "@/lib/utils";
import { ExpandingToggleButton } from "@/registry/base/ui/expanding-toggle-button";

const surfaces = [
  {
    mode: "Light",
    className: styles.light,
    opacity: "2.5%",
  },
  {
    mode: "Dark",
    className: styles.dark,
    opacity: "4%",
  },
] as const;

const treatments = [
  { label: "Plain", detail: "No texture", className: undefined },
  { label: "Grain", detail: "Noise applied", className: styles.grain },
] as const;

const MAGNIFICATION = 4;
const LENS_SIZE = 160;
const KEYBOARD_STEP = 20;

type Surface = (typeof surfaces)[number];
type SurfaceMode = Surface["mode"];
type Treatment = (typeof treatments)[number];
type LensPosition = {
  x: number;
  y: number;
};

function TreatmentPreview({
  treatment,
  mode,
  isMagnifying,
}: {
  treatment: Treatment;
  mode: SurfaceMode;
  isMagnifying: boolean;
}) {
  const isGrain = treatment.label === "Grain";

  return (
    <div
      className={cn(styles.variant, treatment.className)}
      data-grain-mode={isGrain ? mode : undefined}
    >
      <div className={styles.variantHeader}>
        <span>{treatment.label}</span>
        <span>
          {isGrain && isMagnifying
            ? "Noise enlarged · 4×"
            : treatment.detail}
        </span>
      </div>
      <div className={styles.content}>
        <div>
          <p className={styles.title}>Workspace</p>
          <p className={styles.description}>
            Three active tasks are ready for review.
          </p>
        </div>
        <dl className={styles.details}>
          <div>
            <dt>Status</dt>
            <dd>Ready</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>Just now</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function SurfaceRows({ isMagnifying }: { isMagnifying: boolean }) {
  return surfaces.map((surface) => (
    <section
      key={surface.mode}
      className={cn(styles.surface, surface.className)}
      data-surface-mode={surface.mode}
      aria-label={`${surface.mode} mode surface comparison`}
    >
      <header className={styles.header}>
        <span>{surface.mode} mode</span>
        <span className={styles.status}>
          Noise opacity {surface.opacity}
        </span>
      </header>
      <div className={styles.variants}>
        {treatments.map((treatment) => (
          <TreatmentPreview
            key={treatment.label}
            treatment={treatment}
            mode={surface.mode}
            isMagnifying={isMagnifying}
          />
        ))}
      </div>
    </section>
  ));
}

export function SurfaceGrainDemo() {
  const [isMagnifying, setIsMagnifying] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const lensRef = useRef<HTMLDivElement | null>(null);
  const magnifierButtonRef = useRef<HTMLButtonElement | null>(null);
  const positionRef = useRef<LensPosition>({ x: 0, y: 0 });

  const placeLens = useCallback(
    (preview: HTMLDivElement, x: number, y: number) => {
      const lens = lensRef.current;

      if (!lens) {
        return;
      }

      const width = preview.clientWidth;
      const height = preview.clientHeight;
      const previewBounds = preview.getBoundingClientRect();
      const nextX = Math.min(Math.max(x, 0), width);
      const nextY = Math.min(Math.max(y, 0), height);
      const canvas = lens.querySelector<HTMLDivElement>(
        "[data-magnifier-canvas]",
      );

      if (!canvas) {
        return;
      }

      positionRef.current = { x: nextX, y: nextY };
      lens.style.setProperty("--lens-x", `${nextX}px`);
      lens.style.setProperty("--lens-y", `${nextY}px`);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.style.transform = `translate(${LENS_SIZE / 2 - nextX * MAGNIFICATION}px, ${LENS_SIZE / 2 - nextY * MAGNIFICATION}px) scale(${MAGNIFICATION})`;

      let currentMode: SurfaceMode = "Light";

      for (const surface of surfaces) {
        const sourceSurface = preview.querySelector<HTMLElement>(
          `[data-surface-mode="${surface.mode}"]`,
        );

        if (!sourceSurface) {
          continue;
        }

        const surfaceBounds = sourceSurface.getBoundingClientRect();
        const surfaceTop = surfaceBounds.top - previewBounds.top;
        const surfaceBottom = surfaceBounds.bottom - previewBounds.top;

        if (nextY >= surfaceTop && nextY <= surfaceBottom) {
          currentMode = surface.mode;
        }

        const sourceGrain = sourceSurface.querySelector<HTMLElement>(
          `[data-grain-mode="${surface.mode}"]`,
        );
        const noise = lens.querySelector<HTMLDivElement>(
          `[data-magnifier-noise="${surface.mode}"]`,
        );

        if (!sourceGrain || !noise) {
          continue;
        }

        const grainBounds = sourceGrain.getBoundingClientRect();
        const grainLeft = grainBounds.left - previewBounds.left;
        const grainTop = grainBounds.top - previewBounds.top;
        const scaledLeft =
          LENS_SIZE / 2 + (grainLeft - nextX) * MAGNIFICATION;
        const scaledTop =
          LENS_SIZE / 2 + (grainTop - nextY) * MAGNIFICATION;
        const scaledRight = scaledLeft + grainBounds.width * MAGNIFICATION;
        const scaledBottom = scaledTop + grainBounds.height * MAGNIFICATION;
        const visibleLeft = Math.max(0, scaledLeft);
        const visibleTop = Math.max(0, scaledTop);
        const visibleRight = Math.min(LENS_SIZE, scaledRight);
        const visibleBottom = Math.min(LENS_SIZE, scaledBottom);
        const hasVisibleNoise =
          visibleRight > visibleLeft && visibleBottom > visibleTop;

        noise.style.visibility = hasVisibleNoise ? "visible" : "hidden";
        noise.style.backgroundPosition = `${scaledLeft}px ${scaledTop}px`;
        noise.style.clipPath = `inset(${visibleTop}px ${LENS_SIZE - visibleRight}px ${LENS_SIZE - visibleBottom}px ${visibleLeft}px)`;
      }

      lens.dataset.theme = currentMode;
      lens.dataset.visible = "true";
    },
    [],
  );

  useEffect(() => {
    if (!isMagnifying) {
      return;
    }

    const preview = previewRef.current;

    if (!preview) {
      return;
    }

    placeLens(preview, preview.clientWidth / 2, preview.clientHeight / 2);
    preview.focus();
  }, [isMagnifying, placeLens]);

  useEffect(() => {
    if (!isMagnifying) {
      return;
    }

    const repositionLens = () => {
      const preview = previewRef.current;
      const lens = lensRef.current;

      if (!preview || lens?.dataset.visible !== "true") {
        return;
      }

      placeLens(preview, positionRef.current.x, positionRef.current.y);
    };

    window.addEventListener("resize", repositionLens);

    return () => {
      window.removeEventListener("resize", repositionLens);
    };
  }, [isMagnifying, placeLens]);

  const moveLensFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isMagnifying) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    placeLens(
      event.currentTarget,
      event.clientX - bounds.left,
      event.clientY - bounds.top,
    );
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isMagnifying) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    moveLensFromPointer(event);
  };

  const handlePointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    const lens = lensRef.current;

    if (lens && document.activeElement !== event.currentTarget) {
      lens.dataset.visible = "false";
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!isMagnifying) {
      return;
    }

    const { x, y } = positionRef.current;

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        placeLens(event.currentTarget, x - KEYBOARD_STEP, y);
        break;
      case "ArrowRight":
        event.preventDefault();
        placeLens(event.currentTarget, x + KEYBOARD_STEP, y);
        break;
      case "ArrowUp":
        event.preventDefault();
        placeLens(event.currentTarget, x, y - KEYBOARD_STEP);
        break;
      case "ArrowDown":
        event.preventDefault();
        placeLens(event.currentTarget, x, y + KEYBOARD_STEP);
        break;
      case "Escape":
        magnifierButtonRef.current?.focus();
        setIsMagnifying(false);
        break;
    }
  };

  return (
    <figure className={styles.figure}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>Plain vs. Grain</span>
        <div className={styles.headerActions}>
          <span className={styles.status} aria-live="polite">
            {isMagnifying ? (
              <span className="sr-only">Magnifier active</span>
            ) : (
              "Inspect noise at 4×"
            )}
          </span>
          <ExpandingToggleButton
            ref={magnifierButtonRef}
            active={isMagnifying}
            onActiveChange={setIsMagnifying}
            icon={<ZoomInIcon aria-hidden />}
            activeIcon={<XIcon aria-hidden />}
            inactiveLabel="Magnify surface comparison"
            activeLabel="Exit magnifier"
            label="Exit magnifier"
            expandFrom="start"
            aria-keyshortcuts={isMagnifying ? "Escape" : undefined}
            title={isMagnifying ? undefined : "Magnify surface comparison"}
          />
        </div>
      </div>
      <div
        ref={previewRef}
        className={styles.comparison}
        data-magnifying={isMagnifying}
        tabIndex={isMagnifying ? 0 : undefined}
        aria-label="Light and dark plain and grain inspection area"
        aria-describedby="surface-grain-demo-instructions"
        onPointerDown={handlePointerDown}
        onPointerMove={moveLensFromPointer}
        onPointerLeave={handlePointerLeave}
        onBlur={() => {
          if (lensRef.current) {
            lensRef.current.dataset.visible = "false";
          }
        }}
        onFocus={(event) => {
          placeLens(
            event.currentTarget,
            positionRef.current.x,
            positionRef.current.y,
          );
        }}
        onKeyDown={handleKeyDown}
      >
        <SurfaceRows isMagnifying={isMagnifying} />
        <div
          ref={lensRef}
          className={styles.magnifierLens}
          data-active={isMagnifying}
          data-magnifier-lens
          data-theme="Light"
          data-visible="false"
          aria-hidden="true"
        >
          <div
            className={styles.magnifierNoise}
            data-magnifier-noise="Light"
          />
          <div
            className={styles.magnifierNoise}
            data-magnifier-noise="Dark"
          />
          <div className={styles.magnifierCanvas} data-magnifier-canvas>
            <SurfaceRows isMagnifying={isMagnifying} />
          </div>
        </div>
      </div>
      <figcaption id="surface-grain-demo-instructions">
        Select the magnifier above, then move anywhere across the Light and Dark
        demo. The lens enlarges the full interface and noise at 4×; arrow keys
        move it. Use Exit magnifier or press Escape to leave inspection mode.
      </figcaption>
    </figure>
  );
}
