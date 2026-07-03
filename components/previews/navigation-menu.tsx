"use client";

import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/registry/base/ui/navigation-menu";

const componentItems = [
  {
    title: "Interactive primitives",
    description: "Menus, dialogs, drawers, tabs, and form controls.",
  },
  {
    title: "Motion patterns",
    description: "Feedback, layout changes, and state transitions.",
  },
  {
    title: "Client hooks",
    description: "Small utilities for preferences and browser behavior.",
  },
];

const resourceItems = [
  {
    title: "Installation",
    description: "Add registry items with your package runner.",
  },
  {
    title: "API reference",
    description: "Review props, slots, and composition details.",
  },
  {
    title: "Examples",
    description: "Preview behavior before copying code.",
  },
  {
    title: "Changelog",
    description: "Track updates before pulling a component again.",
  },
  {
    title: "Design notes",
    description: "Understand interaction and accessibility decisions.",
  },
  {
    title: "Support",
    description: "Find setup, theming, and troubleshooting docs.",
  },
];

export default function Preview() {
  return (
    <div className="flex min-h-96 w-full items-start justify-center pt-4">
      <NavigationMenu>
        <NavigationMenuList className="rounded-lg border bg-background p-1 shadow-sm">
          <NavigationMenuItem value="components">
            <NavigationMenuTrigger>Components</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[min(31rem,calc(100vw-2rem))] gap-2 p-3 sm:grid-cols-[0.8fr_1fr]">
                <li className="sm:row-span-3">
                  <NavigationMenuLink
                    href="#"
                    className="flex h-full min-h-44 flex-col justify-end rounded-md bg-primary p-5 text-primary-foreground hover:bg-primary/90 focus-visible:bg-primary/90"
                  >
                    <span
                      className="mb-auto flex size-9 items-center justify-center rounded-md bg-primary-foreground/10"
                      aria-hidden="true"
                    >
                      <Sparkles className="size-4" />
                    </span>
                    <div className="mt-6 text-base font-semibold">
                      Registry components
                    </div>
                    <p className="mt-1 text-sm leading-5 text-primary-foreground/75">
                      Install copy-ready UI primitives through the shadcn CLI.
                    </p>
                  </NavigationMenuLink>
                </li>

                {componentItems.map((item) => (
                  <NavigationMenuPreviewItem
                    key={item.title}
                    title={item.title}
                  >
                    {item.description}
                  </NavigationMenuPreviewItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem value="resources">
            <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[min(35rem,calc(100vw-2rem))] gap-2 p-3 sm:grid-cols-2">
                {resourceItems.map((item) => (
                  <NavigationMenuPreviewItem
                    key={item.title}
                    title={item.title}
                  >
                    {item.description}
                  </NavigationMenuPreviewItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink
              href="#"
              className={cn(navigationMenuTriggerStyle(), "p-0 px-3 py-0")}
            >
              Docs
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

function NavigationMenuPreviewItem({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <li>
      <NavigationMenuLink href="#" className="p-3">
        <div className="text-sm font-medium leading-5">{title}</div>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          {children}
        </p>
      </NavigationMenuLink>
    </li>
  );
}
