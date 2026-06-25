import type { ComponentProps } from "react";
import { Blocks, Braces, Component as ComponentIcon } from "lucide-react";

import type { RegistryKind } from "@/lib/registry-kind";
import { cn } from "@/lib/utils";

const registryKindIcons = {
  component: ComponentIcon,
  hook: Braces,
  block: Blocks,
} satisfies Record<RegistryKind, typeof ComponentIcon>;

type RegistryKindIconProps = ComponentProps<typeof ComponentIcon> & {
  kind: RegistryKind;
};

export function RegistryKindIcon({
  kind,
  className,
  ...props
}: RegistryKindIconProps) {
  const Icon = registryKindIcons[kind];

  return (
    <Icon
      aria-hidden="true"
      className={cn("size-4 shrink-0 text-muted-foreground", className)}
      {...props}
    />
  );
}
