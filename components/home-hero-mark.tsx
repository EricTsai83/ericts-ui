import { LogoIcon } from "@/components/icons";
import { MagneticShadow } from "@/registry/base/ui/magnetic-shadow-animation";

export function HomeHeroMark() {
  return (
    <MagneticShadow
      aria-hidden="true"
      className="aspect-square w-full max-w-[360px] lg:w-[min(100%,360px,38vh)]"
      projectedShadowClassName="inset-[14%] size-[72%] text-foreground/[0.075] dark:text-muted/50"
      contactShadowClassName="inset-[14%] size-[72%] text-foreground/[0.16] dark:text-muted/55"
      targetClassName="absolute inset-[14%] size-[72%] text-foreground/88"
    >
      <LogoIcon className="pointer-events-none size-full" />
    </MagneticShadow>
  );
}
