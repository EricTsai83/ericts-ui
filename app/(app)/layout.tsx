import Link from "next/link";
import type { ReactNode } from "react";

import { LogoIcon } from "@/components/icons";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <LogoIcon className="size-5" aria-hidden="true" />
            <span>EricTS UI</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link
              href="/docs"
              className="rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Docs
            </Link>
            <Link
              href="/blocks"
              className="rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Blocks
            </Link>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
