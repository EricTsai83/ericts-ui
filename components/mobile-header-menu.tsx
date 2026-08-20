"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  NavLink,
  type NavLinkMatch,
} from "@/registry/base/ui/nav-link";

type MobileHeaderMenuProps = {
  items: readonly { href: string; label: string }[];
  className?: string;
};

export function MobileHeaderMenu({
  items,
  className,
}: MobileHeaderMenuProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "extend-touch-target h-8 touch-manipulation items-center justify-start gap-2.5 p-0! hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 active:bg-transparent aria-expanded:bg-transparent lg:hidden dark:hover:bg-transparent dark:aria-expanded:bg-transparent",
              className,
            )}
          />
        }
      >
        <div className="relative flex h-8 w-4 items-center justify-center">
          <div className="relative size-4" aria-hidden="true">
            <span
              className={cn(
                "absolute left-0 block h-0.5 w-4 bg-foreground transition-all duration-100 motion-reduce:transition-none",
                open ? "top-[0.4rem] -rotate-45" : "top-1",
              )}
            />
            <span
              className={cn(
                "absolute left-0 block h-0.5 w-4 bg-foreground transition-all duration-100 motion-reduce:transition-none",
                open ? "top-[0.4rem] rotate-45" : "top-2.5",
              )}
            />
          </div>
          <span className="sr-only">Toggle Menu</span>
        </div>
        <span className="flex h-8 items-center text-lg font-medium leading-none">
          Menu
        </span>
      </PopoverTrigger>
      <PopoverContent
        aria-label="Mobile navigation"
        className="no-scrollbar h-[calc(100dvh-3.5rem)] w-dvw max-w-none touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain rounded-none border-none bg-background/95 p-0 shadow-none ring-0 backdrop-blur duration-100 data-open:animate-none! lg:hidden"
        align="start"
        alignOffset={-16}
        collisionAvoidance={{
          align: "shift",
          fallbackAxisSide: "none",
          side: "none",
        }}
        collisionPadding={0}
        positionMethod="fixed"
        side="bottom"
        sideOffset={14}
      >
        <div className="flex min-h-full min-w-0 flex-col px-6 py-6">
          <div className="flex flex-col gap-4">
            <div className="text-sm font-medium text-muted-foreground">
              Menu
            </div>
            <div className="flex flex-col gap-3">
              <MobileLink href="/" onOpenChange={setOpen}>
                Home
              </MobileLink>
              {items.map((item) => (
                <MobileLink
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  match="prefix"
                  onOpenChange={setOpen}
                >
                  {item.label}
                </MobileLink>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function MobileLink({
  href,
  match,
  onOpenChange,
  className,
  children,
}: {
  href: string;
  match?: NavLinkMatch;
  onOpenChange: (open: boolean) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      href={href}
      match={match}
      onClick={() => onOpenChange(false)}
      className={cn(
        "flex min-w-0 max-w-full items-center gap-2 wrap-break-word text-2xl font-medium leading-tight text-foreground transition-colors  hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {children}
    </NavLink>
  );
}
