import { LogoIcon } from "@/components/icons";
import { ProjectedShadow } from "@/registry/base/ui/projected-shadow";

export default function Preview() {
  return (
    <div className="relative flex h-56 w-full max-w-sm items-center justify-center">
      {/* Two axes, and they are not the same axis. Whether the arrow fits is a
          width question — it needs 12rem to the right of centre that a phone
          does not have — so it is gated on `sm`. Which verb is true is an input
          question, and the component gathers on `:active` wherever
          `(hover: none)` matches, which includes a tablet well above `sm`. */}
      <span className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium italic leading-4 text-foreground/65 sm:hidden">
        Press and hold
      </span>
      <div className="pointer-events-none absolute left-[calc(50%+5rem)] top-0 hidden h-24 w-28 text-xs font-medium italic leading-4 text-foreground/65 sm:block">
        <span className="absolute right-1 top-0 translate-x-1/2 whitespace-nowrap">
          <span className="[@media(hover:none)]:hidden">Hover</span>
          <span className="[@media(hover:hover)]:hidden">Press and hold</span>
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 112 96"
          className="absolute left-0 top-0 h-24 w-28 overflow-visible text-foreground/60"
          fill="none"
        >
          <path
            d="M104 18C104 58 78 88 16 94"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M28 82 16 94 31 101"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <ProjectedShadow
        aria-label="Projected shadow heart"
        className="size-40 text-foreground sm:size-44"
        projectedShadowBlur={4}
        // Shadow tints match the hero mark in `home-hero-mark.tsx` so the two
        // hearts read as the same object. The hero drops both layers below
        // `lg`; this demo keeps them at every width, because the layers are
        // the thing being demonstrated.
        projectedShadowClassName="inset-[12%] text-foreground/[0.075] dark:text-muted/50"
        contactShadowClassName="inset-[12%] text-foreground/[0.16] dark:text-muted/55"
        targetClassName="absolute inset-[12%] text-foreground/90"
      >
        <LogoIcon aria-hidden="true" className="pointer-events-none size-full" />
      </ProjectedShadow>
    </div>
  );
}
