"use client";

import { useSearchContext } from "fumadocs-ui/contexts/search";
import { Search } from "lucide-react";

import { GitHubIcon } from "@/components/icons";
import { ThemeModeToggle } from "@/components/theme-mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeaderActions() {
  const { enabled, hotKey, setOpenSearch } = useSearchContext();

  return (
    <div className="ml-auto flex min-w-0 items-center gap-2">
      {enabled ? (
        <button
          type="button"
          data-search-full=""
          className="relative hidden h-8 w-full items-center justify-start gap-2 rounded-lg border-none bg-muted px-3 text-left text-sm font-normal text-foreground shadow-none transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex md:w-48 lg:w-40 xl:w-64 dark:bg-card"
          onClick={() => setOpenSearch(true)}
        >
          <Search className="size-4 shrink-0 text-foreground" aria-hidden="true" />
          <span className="truncate">search...</span>
          {hotKey.length > 0 ? (
            <span className="ml-auto hidden items-center gap-1 text-[0.7rem] text-muted-foreground lg:inline-flex">
              {hotKey.map((key, index) => (
                <kbd
                  key={index}
                  className={cn(
                    "min-w-4 rounded border bg-background px-1 text-center font-mono leading-4 shadow-sm",
                    index > 0 && "-ml-0.5",
                  )}
                >
                  {key.display}
                </kbd>
              ))}
            </span>
          ) : null}
        </button>
      ) : null}
      {enabled ? <HeaderActionSeparator className="hidden md:block" /> : null}
      <a
        href="https://github.com/EricTsai83/ericts-ui"
        target="_blank"
        rel="noreferrer"
        aria-label="Open GitHub repository"
        title="Open GitHub repository"
        className={buttonVariants({ variant: "ghost", size: "icon" })}
      >
        <GitHubIcon aria-hidden="true" />
      </a>
      <HeaderActionSeparator />
      <ThemeModeToggle />
    </div>
  );
}

function HeaderActionSeparator({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("h-4 w-px shrink-0 bg-border/60", className)}
    />
  );
}
