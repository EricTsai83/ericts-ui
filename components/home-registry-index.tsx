import { ArrowRight } from "lucide-react";
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
 * Every heading sits on a hairline, at three weights: the masthead and the part
 * headers on `border`, the category headers on `border/60`. That is what keeps
 * a page of short link text from reading as scattered — the rules give each
 * column a left-to-right edge to hang from, so the wide gutters beside a
 * two-word title become deliberate margin instead of leftover space.
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
  const totalItems = parts.reduce((total, part) => total + countItems(part), 0);

  return (
    <section
      aria-labelledby="registry-index-title"
      className="surface-grain relative min-w-0 bg-registry-surface px-5 py-8 text-foreground sm:px-8 sm:py-10 lg:min-h-[calc(100vh-3.5rem)] lg:px-10 lg:py-10 xl:px-12"
    >
      <header className="flex items-end justify-between gap-6 border-b pb-5">
        <div className="flex min-w-0 flex-col gap-2.5">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Index
          </p>
          <h2
            id="registry-index-title"
            className="text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-4xl"
          >
            Contents
          </h2>
        </div>
        <p className="shrink-0 pb-1 font-mono text-xs tabular-nums text-muted-foreground">
          {totalItems} items
        </p>
      </header>

      <div className="mt-10 flex flex-col gap-14">
        {componentPart ? <RegistryPart part={componentPart} /> : null}

        {supportingParts.length > 0 ? (
          <div className="grid gap-14 sm:grid-cols-2 sm:gap-10">
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

function RegistryPart({ part }: { part: HomeRegistryIndexPart }) {
  const label = getRegistryKindGroupLabel(part.kind);
  const isComponent = part.kind === "component";

  return (
    <section aria-labelledby={`registry-part-${part.kind}`}>
      {/*
       * The count and arrow ride in the header's own hairline rather than in a
       * "View all" button of their own: the rule already spans the part's full
       * width, so its right end is free real estate that costs no vertical
       * space. The arrow keeps its slot in flow at rest and only animates
       * opacity and offset, so revealing it cannot reflow the row.
       */}
      <Link
        href={`/${getRegistryKindSegment(part.kind)}`}
        className="group mb-6 flex items-center gap-3 border-b pb-4 text-foreground transition-colors duration-150 hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-registry-surface"
      >
        <RegistryKindIcon
          kind={part.kind}
          className={cn(
            "text-muted-foreground transition-colors duration-150 group-hover:text-foreground",
            isComponent ? "size-5" : "size-4",
          )}
        />
        <h3
          id={`registry-part-${part.kind}`}
          className={cn(
            "min-w-0 font-semibold tracking-[-0.025em] text-balance",
            isComponent ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl",
          )}
        >
          {label}
        </h3>
        <span
          aria-hidden="true"
          className="ml-auto flex shrink-0 items-center gap-2 font-mono text-xs tabular-nums text-muted-foreground transition-colors duration-150 group-hover:text-foreground"
        >
          {countItems(part)}
          <ArrowRight className="size-3.5 opacity-0 transition duration-150 group-hover:opacity-100 motion-safe:-translate-x-1 motion-safe:group-hover:translate-x-0" />
        </span>
      </Link>

      <div
        className={cn(
          isComponent
            ? "columns-1 gap-x-10 sm:columns-2 2xl:columns-3"
            : "flex flex-col gap-8",
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
      className="mb-9 break-inside-avoid last:mb-0"
    >
      {/*
       * Uppercase and a step *smaller* than the items it labels. A category is
       * signposting, not content, so sizing it above the titles — as a plain
       * `text-base` heading did — made the eye read the taxonomy first and the
       * registry second. Letterspacing carries the emphasis instead of size.
       */}
      <h4
        id={headingId}
        className="mb-2.5 flex items-center gap-2.5 border-b border-border/60 pb-2 text-[13px] font-semibold uppercase tracking-[0.07em]"
      >
        <span className="font-mono text-[11px] font-normal tabular-nums text-muted-foreground">
          {String(groupIndex + 1).padStart(2, "0")}
        </span>
        <span className="min-w-0 truncate">{group.label}</span>
      </h4>

      <ol className="flex flex-col">
        {group.items.map((item) => (
          <li key={item.name} className="min-w-0">
            <Link
              href={item.href}
              className="group -mx-2 flex min-h-8 items-center rounded-md px-2 text-sm leading-5 text-foreground/75 transition-colors duration-150 hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0 shrink truncate">{item.title}</span>
              {/*
               * The affordance sits beside the title, not at the row's far
               * edge. A column is much wider than a two-word title, so an arrow
               * pinned right would float unattached to the thing it points at.
               */}
              <ArrowRight
                aria-hidden="true"
                className="ml-1.5 size-3.5 shrink-0 text-muted-foreground opacity-0 transition duration-150 group-hover:opacity-100 motion-safe:-translate-x-1 motion-safe:group-hover:translate-x-0"
              />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function countItems(part: HomeRegistryIndexPart) {
  return part.groups.reduce((total, group) => total + group.items.length, 0);
}
