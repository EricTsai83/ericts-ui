"use client";

import type { VariantProps } from "class-variance-authority";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Like, type LikeProps } from "./like";

export type LikeButtonProps = LikeProps & VariantProps<typeof buttonVariants>;

/** A ready-made labeled button built from the composable Like primitive. */
export function LikeButton({
  children = "Like",
  className,
  iconSize = 16,
  size = "default",
  variant = "outline",
  ...props
}: LikeButtonProps) {
  return (
    <Like
      className={cn(buttonVariants({ variant, size }), className)}
      iconSize={iconSize}
      {...props}
    >
      {children}
    </Like>
  );
}
