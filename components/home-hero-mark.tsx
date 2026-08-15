import { LogoIcon } from "@/components/icons";
import { ProjectedShadow } from "@/registry/base/ui/projected-shadow";

// Height-bound rather than width-bound: the hero panel is a fixed-height
// sticky column, so the mark yields space to the copy on short viewports
// instead of overflowing.
export function HomeHeroMark() {
  return (
    <>
      <ProjectedShadow
        animated={false}
        aria-hidden="true"
        className="aspect-square h-full max-h-[304px] w-auto max-w-full lg:hidden"
        targetClassName="absolute inset-[14%] size-[72%] text-foreground/88"
      >
        <LogoIcon className="pointer-events-none size-full" />
      </ProjectedShadow>

      <ProjectedShadow
        aria-hidden="true"
        className="hidden aspect-square h-full max-h-[304px] w-auto max-w-full lg:inline-flex"
        projectedShadowClassName="inset-[14%] size-[72%] text-foreground/[0.075] dark:text-muted/50"
        contactShadowClassName="inset-[14%] size-[72%] text-foreground/[0.16] dark:text-muted/55"
        targetClassName="absolute inset-[14%] size-[72%] text-foreground/88"
      >
        <LogoIcon className="pointer-events-none size-full" />
      </ProjectedShadow>
    </>
  );
}
