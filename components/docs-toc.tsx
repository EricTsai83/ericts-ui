"use client";

import type { ComponentProps } from "react";
import { useEffect, useMemo, useState } from "react";
import { useTOCItems } from "fumadocs-ui/components/toc";

import { cn } from "@/lib/utils";

function useActiveItem(itemIds: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "0% 0% -80% 0%" },
    );

    for (const id of itemIds) {
      const element = document.getElementById(id);

      if (element) {
        observer.observe(element);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [itemIds]);

  return activeId;
}

export function DocsTableOfContents({
  container,
}: {
  container?: ComponentProps<"div">;
}) {
  const toc = useTOCItems();
  const itemIds = useMemo(
    () => toc.map((item) => item.url.replace(/^#/, "")),
    [toc],
  );
  const activeHeading = useActiveItem(itemIds);

  if (!toc.length) {
    return (
      <div
        id="nd-toc-placeholder"
        aria-hidden="true"
        className="hidden xl:layout:[--fd-toc-width:var(--fd-sidebar-width)]"
      />
    );
  }

  return (
    <aside
      id="nd-toc"
      aria-labelledby="toc-title"
      {...container}
      className={cn(
        "sticky top-(--fd-docs-row-1) hidden h-[calc(var(--fd-docs-height)-var(--fd-docs-row-1))] w-(--fd-toc-width) flex-col [grid-area:toc] overflow-hidden pt-12 pe-4 pb-2 xl:layout:[--fd-toc-width:var(--fd-sidebar-width)] xl:flex",
        container?.className,
      )}
    >
      <nav className="no-scrollbar flex min-h-0 flex-col gap-2 overflow-y-auto p-4 pt-0 text-sm">
        <p
          id="toc-title"
          className="sticky top-0 z-10 h-6 bg-background text-xs font-medium text-muted-foreground"
        >
          On This Page
        </p>
        {toc.map((item) => (
          <a
            key={item.url}
            href={item.url}
            data-active={item.url === `#${activeHeading}`}
            data-depth={item.depth}
            className="text-[0.8rem] leading-5 text-muted-foreground no-underline transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[active=true]:font-medium data-[active=true]:text-foreground data-[depth='3']:pl-4 data-[depth='4']:pl-6"
          >
            {item.title}
          </a>
        ))}
      </nav>
    </aside>
  );
}
