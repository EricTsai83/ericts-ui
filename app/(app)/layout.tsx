import Link from "next/link";
import type { ReactNode } from "react";

import { HeaderActions } from "@/components/header-actions";
import { LogoIcon } from "@/components/icons";
import { MobileHeaderMenu } from "@/components/mobile-header-menu";
import { primaryNavItems } from "@/lib/navigation";
import { source } from "@/lib/source";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 h-14 border-b bg-background/95 text-foreground shadow-none backdrop-blur supports-[backdrop-filter]:bg-background/80 dark:shadow-sm">
        <div className="relative flex h-full w-full items-center px-4 sm:px-6">
          <MobileHeaderMenu tree={source.pageTree} items={primaryNavItems} />
          <Link
            href="/"
            className="hidden h-full items-center gap-2 text-sm font-semibold leading-none text-foreground transition-colors hover:text-accent-foreground lg:mr-5 lg:flex lg:min-w-28"
          >
            <LogoIcon className="block size-5 shrink-0" aria-hidden="true" />
            <span>ericts/ui</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm font-medium text-foreground lg:flex">
            {primaryNavItems.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className="rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <HeaderActions />
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
