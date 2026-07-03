"use client";

import * as React from "react";
import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui/react/navigation-menu";
import { ChevronDown } from "lucide-react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

type NavigationMenuProps = NavigationMenuPrimitive.Root.Props &
  Pick<NavigationMenuPrimitive.Positioner.Props, "align"> & {
    positionerClassName?: string;
  };

function NavigationMenu({
  align = "center",
  className,
  children,
  positionerClassName,
  ...props
}: NavigationMenuProps) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      className={cn(
        "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
        className,
      )}
      {...props}
    >
      {children}
      <NavigationMenuPositioner
        align={align}
        className={positionerClassName}
      />
    </NavigationMenuPrimitive.Root>
  );
}

function NavigationMenuList({
  className,
  ...props
}: NavigationMenuPrimitive.List.Props) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn(
        "flex flex-1 list-none items-center justify-center gap-0",
        className,
      )}
      {...props}
    />
  );
}

function NavigationMenuItem({
  className,
  ...props
}: NavigationMenuPrimitive.Item.Props) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={cn("relative", className)}
      {...props}
    />
  );
}

const navigationMenuTriggerStyle = cva(
  "group/navigation-menu-trigger inline-flex h-8 w-max items-center justify-center rounded-md px-3 text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none",
);

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: NavigationMenuPrimitive.Trigger.Props) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerStyle(), "group", className)}
      {...props}
    >
      {children}
      <NavigationMenuPrimitive.Icon
        data-slot="navigation-menu-trigger-icon"
        className="ml-1 inline-flex transition-transform duration-200 data-popup-open:rotate-180 motion-reduce:transition-none [&_svg]:size-3.5"
      >
        <ChevronDown aria-hidden="true" />
      </NavigationMenuPrimitive.Icon>
    </NavigationMenuPrimitive.Trigger>
  );
}

function NavigationMenuContent({
  className,
  ...props
}: NavigationMenuPrimitive.Content.Props) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "h-full w-auto p-1 transition-[opacity,transform] duration-200 ease-out data-ending-style:translate-y-1 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:translate-y-1 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:animate-none motion-reduce:transition-none motion-reduce:data-ending-style:translate-y-0 motion-reduce:data-ending-style:scale-100 motion-reduce:data-ending-style:opacity-100 motion-reduce:data-starting-style:translate-y-0 motion-reduce:data-starting-style:scale-100 motion-reduce:data-starting-style:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function NavigationMenuPositioner({
  className,
  side = "bottom",
  sideOffset = 8,
  align = "center",
  collisionPadding = 16,
  collisionAvoidance = {
    side: "none",
    align: "shift",
    fallbackAxisSide: "none",
  },
  children,
  ...props
}: NavigationMenuPrimitive.Positioner.Props) {
  return (
    <NavigationMenuPrimitive.Portal>
      <NavigationMenuPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        collisionPadding={collisionPadding}
        collisionAvoidance={collisionAvoidance}
        data-slot="navigation-menu-positioner"
        className={cn(
          "isolate z-50 h-(--positioner-height) w-(--positioner-width) max-w-(--available-width) transition-[top,left,right,bottom] duration-200 ease-out data-instant:transition-none motion-reduce:transition-none",
          "before:absolute before:content-[''] data-[side=bottom]:before:inset-x-0 data-[side=bottom]:before:-top-2 data-[side=bottom]:before:h-2",
          className,
        )}
        {...props}
      >
        {children ?? <NavigationMenuPopup />}
      </NavigationMenuPrimitive.Positioner>
    </NavigationMenuPrimitive.Portal>
  );
}

function NavigationMenuPopup({
  className,
  children,
  ...props
}: NavigationMenuPrimitive.Popup.Props) {
  return (
    <NavigationMenuPrimitive.Popup
      data-slot="navigation-menu-popup"
      className={cn(
        "relative h-(--popup-height) w-(--popup-width) max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-sm outline-none transition-[opacity,transform,width,height] duration-200 ease-out data-[side=bottom]:origin-top data-[side=left]:origin-right data-[side=right]:origin-left data-[side=top]:origin-bottom data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:animate-none motion-reduce:transition-none motion-reduce:data-ending-style:scale-100 motion-reduce:data-ending-style:opacity-100 motion-reduce:data-starting-style:scale-100 motion-reduce:data-starting-style:opacity-100",
        className,
      )}
      {...props}
    >
      {children ?? <NavigationMenuViewport />}
    </NavigationMenuPrimitive.Popup>
  );
}

function NavigationMenuViewport({
  className,
  ...props
}: NavigationMenuPrimitive.Viewport.Props) {
  return (
    <NavigationMenuPrimitive.Viewport
      data-slot="navigation-menu-viewport"
      className={cn(
        "relative size-full overflow-hidden motion-reduce:animate-none motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

function NavigationMenuLink({
  className,
  ...props
}: NavigationMenuPrimitive.Link.Props) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        "block select-none rounded-md p-3 text-sm leading-none text-foreground no-underline outline-none transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-active:bg-muted/60 motion-reduce:transition-none [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function NavigationMenuArrow({
  className,
  ...props
}: NavigationMenuPrimitive.Arrow.Props) {
  return (
    <NavigationMenuPrimitive.Arrow
      data-slot="navigation-menu-arrow"
      className={cn(
        "flex size-3 rotate-45 border border-border bg-popover data-[side=bottom]:-translate-y-1.5 data-[side=left]:translate-x-1.5 data-[side=right]:-translate-x-1.5 data-[side=top]:translate-y-1.5",
        className,
      )}
      {...props}
    />
  );
}

export {
  NavigationMenu,
  NavigationMenuArrow,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPopup,
  NavigationMenuPositioner,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
};
