"use client";

import * as React from "react";
import {
  BellIcon,
  BellOffIcon,
  BookmarkCheckIcon,
  BookmarkIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  Maximize2Icon,
  Minimize2Icon,
  MoonIcon,
  PauseIcon,
  PlayIcon,
  SunIcon,
  UnlockIcon,
  Volume2Icon,
  VolumeXIcon,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { IconSwap as CssOnlyIconSwap } from "@/registry/base/css-only/icon-swap";
import { IconSwap as MotionIconSwap } from "@/registry/base/ui/icon-swap";

const iconPairs: Array<{
  label: string;
  activeLabel: string;
  icon: LucideIcon;
  activeIcon: LucideIcon;
}> = [
  {
    label: "Play",
    activeLabel: "Pause",
    icon: PlayIcon,
    activeIcon: PauseIcon,
  },
  {
    label: "Sound on",
    activeLabel: "Muted",
    icon: Volume2Icon,
    activeIcon: VolumeXIcon,
  },
  {
    label: "Visible",
    activeLabel: "Hidden",
    icon: EyeIcon,
    activeIcon: EyeOffIcon,
  },
  {
    label: "Bookmark",
    activeLabel: "Bookmarked",
    icon: BookmarkIcon,
    activeIcon: BookmarkCheckIcon,
  },
  {
    label: "Light theme",
    activeLabel: "Dark theme",
    icon: SunIcon,
    activeIcon: MoonIcon,
  },
  {
    label: "Notifications on",
    activeLabel: "Notifications off",
    icon: BellIcon,
    activeIcon: BellOffIcon,
  },
  {
    label: "Locked",
    activeLabel: "Unlocked",
    icon: LockIcon,
    activeIcon: UnlockIcon,
  },
  {
    label: "Enter fullscreen",
    activeLabel: "Exit fullscreen",
    icon: Maximize2Icon,
    activeIcon: Minimize2Icon,
  },
];

type SwapIconButtonProps = (typeof iconPairs)[number] & {
  cssOnly: boolean;
};

function SwapIconButton({
  label,
  activeLabel,
  icon: Icon,
  activeIcon: ActiveIcon,
  cssOnly,
}: SwapIconButtonProps) {
  const IconSwap = cssOnly ? CssOnlyIconSwap : MotionIconSwap;
  const [active, setActive] = React.useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={active ? activeLabel : label}
      onClick={() => setActive((current) => !current)}
    >
      <IconSwap
        active={active}
        icon={<Icon />}
        activeIcon={<ActiveIcon />}
        data-icon="icon"
      />
    </Button>
  );
}

export default function Preview({ variant }: { variant: string }) {
  const cssOnly = variant === "css-only";

  return (
    <div className="flex max-w-sm flex-wrap items-center justify-center gap-2">
      {iconPairs.map((pair) => (
        <SwapIconButton key={pair.label} {...pair} cssOnly={cssOnly} />
      ))}
    </div>
  );
}
