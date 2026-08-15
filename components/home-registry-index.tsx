import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { RegistryKindIcon } from "@/components/registry-kind-icon";
import {
  getRegistryKindGroupLabel,
  getRegistryKindSegment,
  type RegistryKind,
} from "@/lib/registry-kind";

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
 * uneven sizes — seven component categories next to one block category — carry
 * the visual rhythm that a uniform grid of tiles could not.
 *
 * All three parts are full-width peers running the same column flow. Hooks and
 * Blocks used to sit side by side in a two-column row, which set their heights
 * against each other for no reason: Hooks stacked three categories into a narrow
 * column while Blocks ran out after one, so the row was as tall as the longer
 * part and half of it was empty. Flowing every part through the same columns
 * costs nothing in height and drops that ragged seam.
 *
 * The only rule on the page sits under a category heading. Headings above that
 * level are separated by space alone — the type sizes already rank them, and
 * stacking a rule under each one turned a reading order into a stack of tables.
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

  return (
    <section
      aria-labelledby="registry-index-title"
      className="surface-grain relative min-w-0 bg-registry-surface px-5 py-8 text-foreground sm:px-8 sm:py-10 lg:min-h-[calc(100vh-3.5rem)] lg:px-10 lg:py-10 xl:px-12"
    >
      {/*
       * "Index" over "The Registry", not over "Contents". The eyebrow names what
       * this panel *is* and the title names what it *indexes*; the previous pair
       * spent both lines on synonyms, and the title then said less than the
       * "Components" heading directly beneath it. Mirrors the hero column's
       * "Built on" eyebrow, so both columns open the same way.
       */}
      <header className="flex flex-col gap-2.5">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Index
        </p>
        <h2
          id="registry-index-title"
          className="text-3xl font-semibold tracking-[-0.035em] text-balance sm:text-4xl"
        >
          The Registry
        </h2>
      </header>

      <div className="mt-12 flex flex-col gap-16">
        {parts.map((part) => (
          <RegistryPart key={part.kind} part={part} />
        ))}
      </div>
    </section>
  );
}

function RegistryPart({ part }: { part: HomeRegistryIndexPart }) {
  return (
    <section aria-labelledby={`registry-part-${part.kind}`}>
      {/*
       * `inline-flex`, so the link is only as wide as its own text. Stretching
       * it across the row would put most of the hit area over empty surface,
       * and the arrow would land at the far right, unattached to the title it
       * points at. The arrow keeps its slot in flow at rest and only animates
       * opacity and offset, so revealing it cannot reflow the row.
       */}
      <Link
        href={`/${getRegistryKindSegment(part.kind)}`}
        className="group mb-7 inline-flex min-w-0 items-center gap-3 rounded-sm text-foreground transition-colors duration-150 hover:text-foreground/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-registry-surface"
      >
        <RegistryKindIcon
          kind={part.kind}
          className="size-5 text-muted-foreground transition-colors duration-150 group-hover:text-foreground/65"
        />
        <h3
          id={`registry-part-${part.kind}`}
          className="min-w-0 text-2xl font-semibold tracking-[-0.025em] text-balance sm:text-3xl"
        >
          {getRegistryKindGroupLabel(part.kind)}
        </h3>
        <ArrowRight
          aria-hidden="true"
          className="size-4 shrink-0 opacity-0 transition duration-150 group-hover:opacity-100 motion-safe:-translate-x-1 motion-safe:group-hover:translate-x-0"
        />
      </Link>

      {/*
       * `column-width`, not a breakpoint ladder. The column count has to follow
       * the *panel*, and the panel is 60% of the viewport minus padding that
       * itself changes at three breakpoints — so `sm:columns-2 xl:columns-3` was
       * guessing at a width it never actually measured, and the guess put three
       * columns at 12.3rem each near the `xl` threshold, narrower than the
       * longest title. At 15rem the browser fits as many columns as clear the
       * longest item ("Expandable Segmented Tabs", 14.4rem with its arrow) and
       * drops to fewer rather than truncating.
       */}
      <div className="columns-[15rem] gap-x-10">
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
       *
       * Its rule is what gives each column a left-to-right edge to hang from,
       * so the gutter beside a two-word title reads as margin rather than as
       * space the layout failed to fill.
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
              className="group -mx-2 flex min-h-8 items-center gap-3 rounded-md px-2 text-sm leading-5 text-foreground/75 transition-colors duration-150 hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0 shrink truncate">{item.title}</span>
              {/*
               * `ml-auto` puts the arrow on the row's trailing edge, which the
               * row's `-mx-2 px-2` lands exactly under the right terminus of the
               * category heading's rule — so the whole column shares one right
               * margin. It keeps its slot in flow at rest and only animates
               * opacity and offset, so revealing it cannot reflow the row.
               */}
              <ArrowRight
                aria-hidden="true"
                className="ml-auto size-3.5 shrink-0 text-muted-foreground opacity-0 transition duration-150 group-hover:opacity-100 motion-safe:-translate-x-1 motion-safe:group-hover:translate-x-0"
              />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
