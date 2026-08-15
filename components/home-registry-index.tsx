import Link from "next/link";

import { RegistryKindIcon } from "@/components/registry-kind-icon";
import {
  getRegistryKindGroupLabel,
  getRegistryKindSegment,
  type RegistryKind,
} from "@/lib/registry-kind";
import { cn } from "@/lib/utils";

export type HomeRegistryIndexItem = {
  name: string;
  title: string;
  href: string;
};

export type HomeRegistryIndexGroup = {
  /** A semantic category inside one registry kind. */
  label: string;
  items: HomeRegistryIndexItem[];
};

export type HomeRegistryIndexPart = {
  kind: RegistryKind;
  groups: HomeRegistryIndexGroup[];
};

/**
 * The full registry as a typeset index: every item, grouped by what it does.
 *
 * Deliberately a server component with no live previews. The homepage used to
 * mount eight client vignettes plus a playback engine to show motion, which put
 * `motion/react` and every featured component in the landing bundle. Here the
 * only motion is CSS on hover, so the page costs nothing at rest and the groups'
 * uneven sizes — nine animation items next to one layout item — carry the
 * visual rhythm that a uniform grid of tiles could not.
 *
 * No entrance animation, deliberately. Fading nine groups in from 4px below read
 * as the layout still settling rather than as an entrance: the offset was too
 * small and the 500ms too slow to register as intent, every group moved in
 * unison against a sticky hero column that never moves, and `animate-in` leaves
 * `animation-fill-mode: none`, so a first paint that beat the animation's first
 * frame snapped the block down before easing it back.
 */
export function HomeRegistryIndex({
  parts,
}: {
  parts: HomeRegistryIndexPart[];
}) {
  if (parts.length === 0) {
    return null;
  }

  const componentPart = parts.find((part) => part.kind === "component");
  const supportingParts = parts.filter((part) => part.kind !== "component");

  return (
    <section
      aria-labelledby="registry-index-title"
      className="relative min-w-0 bg-registry-surface px-5 py-8 text-foreground sm:px-8 sm:py-10 lg:min-h-[calc(100vh-3.5rem)] lg:px-10 lg:py-10 xl:px-12"
    >
      <header>
        <h2
          id="registry-index-title"
          className="text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-4xl"
        >
          Contents
        </h2>
      </header>

      <div className="mt-12 flex flex-col gap-16">
        {componentPart ? (
          <RegistryPart part={componentPart} />
        ) : null}

        {supportingParts.length > 0 ? (
          <div className="grid gap-16 sm:grid-cols-2 sm:gap-10">
            {supportingParts.map((part) => (
              <div key={part.kind} className="min-w-0">
                <RegistryPart part={part} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function RegistryPart({
  part,
}: {
  part: HomeRegistryIndexPart;
}) {
  const label = getRegistryKindGroupLabel(part.kind);

  return (
    <section aria-labelledby={`registry-part-${part.kind}`}>
      <header className="mb-7">
        <Link
          href={`/${getRegistryKindSegment(part.kind)}`}
          className="group inline-flex items-center gap-3 rounded-sm text-foreground transition-colors duration-150 hover:text-foreground/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-registry-surface"
        >
          <RegistryKindIcon
            kind={part.kind}
            className="size-6 text-muted-foreground transition-colors duration-150 group-hover:text-foreground/65"
          />
          <h3
            id={`registry-part-${part.kind}`}
            className={cn(
              "font-semibold tracking-[-0.025em] text-balance",
              part.kind === "component"
                ? "text-3xl sm:text-4xl"
                : "text-2xl sm:text-3xl",
            )}
          >
            {label}
          </h3>
        </Link>
      </header>

      <div
        className={cn(
          part.kind === "component"
            ? "columns-1 gap-x-10 sm:columns-2 2xl:columns-3"
            : "flex flex-col gap-7",
        )}
      >
        {part.groups.map((group, groupIndex) => (
          <RegistryGroup
            key={group.label}
            group={group}
            groupIndex={groupIndex}
            partKind={part.kind}
          />
        ))}
      </div>
    </section>
  );
}

function RegistryGroup({
  group,
  groupIndex,
  partKind,
}: {
  group: HomeRegistryIndexGroup;
  groupIndex: number;
  partKind: RegistryKind;
}) {
  const headingId = `registry-${partKind}-chapter-${groupIndex + 1}`;

  return (
    <section
      aria-labelledby={headingId}
      className="mb-8 break-inside-avoid last:mb-0"
    >
      <h4
        id={headingId}
        className="mb-3 flex items-baseline gap-2 truncate text-base font-semibold tracking-tight"
      >
        <span className="font-mono text-xs font-normal text-muted-foreground">
          {String(groupIndex + 1).padStart(2, "0")}
        </span>
        {group.label}
      </h4>

      <ol className="flex flex-col">
        {group.items.map((item) => (
          <li key={item.name} className="min-w-0">
            <Link
              href={item.href}
              className="-mx-2 flex min-h-8 items-center rounded-md px-2 text-sm leading-5 text-foreground/75 transition-colors duration-150 hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0 shrink truncate">{item.title}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
