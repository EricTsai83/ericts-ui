import { LogoIcon } from "@/components/icons";
import { ProjectedShadow } from "@/registry/base/ui/projected-shadow-animation";

export default function Preview() {
  return (
    <div className="relative flex h-56 w-full max-w-sm items-center justify-center">
      <div className="pointer-events-none absolute left-[calc(50%+5rem)] top-0 h-24 w-28 text-xs font-medium italic leading-4 text-foreground/65">
        <span className="absolute right-1 top-0 translate-x-1/2 whitespace-nowrap">
          Hover
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
        projectedShadowClassName="inset-[12%] text-foreground/20 dark:text-muted/50"
        contactShadowClassName="inset-[12%] text-foreground/30 dark:text-muted/60"
        targetClassName="absolute inset-[12%] text-foreground/90"
      >
        <LogoIcon aria-hidden="true" className="pointer-events-none size-full" />
      </ProjectedShadow>
    </div>
  );
}
