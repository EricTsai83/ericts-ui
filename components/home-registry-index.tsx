import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export type HomeRegistryIndexItem = {
  name: string;
  title: string;
  href: string;
};

export type HomeRegistryIndexGroup = {
  /** Group heading; a semantic category for components, a kind for the rest. */
  label: string;
  items: HomeRegistryIndexItem[];
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
  groups,
}: {
  groups: HomeRegistryIndexGroup[];
}) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <section className="flex min-w-0 flex-col gap-6">
      <div className="flex items-center gap-3">
        <h2 className="shrink-0 text-xl font-semibold tracking-tight">
          Registry
        </h2>
        <div className="h-px flex-1 bg-border" />
      </div>

      <p className="max-w-2xl text-base leading-7 text-muted-foreground">
        Every component, hook, and block, grouped by what it does. Open one for
        its docs, live states, and install command.
      </p>

      {/* Column flow rather than a grid: groups vary from one to nine items, so
          letting them pack into columns keeps the sheet dense instead of
          leaving a grid's ragged gaps. */}
      <div className="columns-1 gap-x-10 sm:columns-2 xl:columns-3">
        {groups.map((group) => (
          <div
            key={group.label}
            className="mb-7 break-inside-avoid last:mb-0"
          >
            <div className="mb-1.5 flex items-baseline justify-between gap-2 border-b pb-2">
              <h3 className="truncate font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-foreground">
                {group.label}
              </h3>
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                {group.items.length}
              </span>
            </div>

            <ul className="flex flex-col">
              {group.items.map((item) => (
                <li key={item.name} className="min-w-0">
                  <Link
                    href={item.href}
                    className="group/item -mx-2 flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm leading-5 text-foreground/75 transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="truncate">{item.title}</span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-3 shrink-0 -translate-x-1 opacity-0 transition-[opacity,transform] duration-150 group-hover/item:translate-x-0 group-hover/item:opacity-100 group-focus-visible/item:translate-x-0 group-focus-visible/item:opacity-100"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
