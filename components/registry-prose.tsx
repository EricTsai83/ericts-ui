import type { ReactNode } from "react";

import type { ComponentCodeFile } from "@/components/component-showcase";

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-[0.35em] bg-muted px-[0.3em] py-[0.125em] font-mono text-[0.85em] font-normal text-foreground">
      {children}
    </code>
  );
}

export function CodeSnippet({ snippet }: { snippet: ComponentCodeFile }) {
  return <div className="min-w-0 [&_figure]:my-0">{snippet.highlighted}</div>;
}

export function DocLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline decoration-muted-foreground/40 underline-offset-4 transition-colors hover:decoration-foreground"
    >
      {children}
    </a>
  );
}
