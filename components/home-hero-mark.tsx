import { LogoIcon } from "@/components/icons";

export function HomeHeroMark() {
  return (
    <div
      aria-hidden="true"
      className="home-hero-mark relative aspect-square w-full max-w-[360px] lg:w-[min(100%,360px,38vh)]"
    >
      <div className="home-hero-mark__layer home-hero-mark__projected-shadow pointer-events-none absolute inset-[14%] size-[72%] blur-[6px] text-foreground/[0.075] dark:text-muted/50">
        <LogoIcon className="size-full" />
      </div>

      <div className="home-hero-mark__layer home-hero-mark__contact-shadow pointer-events-none absolute inset-[14%] size-[72%] text-foreground/[0.16] dark:text-muted/55">
        <LogoIcon className="size-full" />
      </div>

      <div className="home-hero-mark__layer home-hero-mark__heart pointer-events-none absolute inset-[14%] size-[72%] text-foreground/88">
        <LogoIcon className="pointer-events-none size-full" />
      </div>
    </div>
  );
}
