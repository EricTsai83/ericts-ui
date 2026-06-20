import * as React from "react";

import { cn } from "@/lib/utils";

import "./staggered-entrance.css";

type CssVariableStyle = React.CSSProperties & Record<`--${string}`, string>;
type StaggeredEntranceAxis = "x" | "y";
type StaggeredEntranceKey<TItem> =
  | React.Key
  | ((item: TItem, index: number) => React.Key);
type StaggeredEntranceClassName<TItem> =
  | string
  | ((item: TItem, index: number) => string | undefined);
type StaggeredEntranceStyle<TItem> =
  | React.CSSProperties
  | ((item: TItem, index: number) => React.CSSProperties | undefined);

export type StaggeredEntranceProps<TItem = React.ReactNode> = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "children"
> & {
  as?: React.ElementType;
  itemAs?: React.ElementType;
  children?: React.ReactNode;
  items?: readonly TItem[];
  renderItem?: (item: TItem, index: number) => React.ReactNode;
  delay?: number | string;
  duration?: number | string;
  initialDelay?: number | string;
  staggerOffset?: number;
  axis?: StaggeredEntranceAxis;
  distance?: number | string;
  scale?: number;
  opacity?: number;
  reverse?: boolean;
  disabled?: boolean;
  getItemKey?: StaggeredEntranceKey<TItem>;
  itemClassName?: StaggeredEntranceClassName<TItem>;
  itemStyle?: StaggeredEntranceStyle<TItem>;
};

export type StaggeredEntranceItemProps = React.ComponentPropsWithoutRef<"div"> & {
  as?: React.ElementType;
  index?: number;
};

export function StaggeredEntrance<TItem = React.ReactNode>({
  as: Component = "div",
  itemAs = "div",
  children,
  items,
  renderItem,
  getItemKey,
  delay = 80,
  duration = 500,
  initialDelay = 0,
  staggerOffset = 0,
  axis = "y",
  distance = 10,
  scale = 1,
  opacity = 0,
  reverse = false,
  disabled = false,
  itemClassName,
  itemStyle,
  className,
  style,
  ...props
}: StaggeredEntranceProps<TItem>) {
  const entries = React.useMemo(
    () =>
      items
        ? items.map((item, index) => ({
            item,
            content: renderItem
              ? renderItem(item, index)
              : (item as React.ReactNode),
          }))
        : React.Children.toArray(children).map((child) => ({
            item: child as TItem,
            content: child,
          })),
    [children, items, renderItem]
  );
  const count = entries.length;
  const resolvedDistance = toCssLength(distance);
  const staggeredEntranceStyle: CssVariableStyle = {
    "--staggered-entrance-delay": toCssTime(delay),
    "--staggered-entrance-duration": toCssTime(duration),
    "--staggered-entrance-initial-delay": toCssTime(initialDelay),
    "--staggered-entrance-from-x": axis === "x" ? resolvedDistance : "0px",
    "--staggered-entrance-from-y": axis === "y" ? resolvedDistance : "0px",
    "--staggered-entrance-from-scale": String(scale),
    "--staggered-entrance-from-opacity": String(opacity),
    ...style,
  };

  return (
    <Component
      {...props}
      data-slot="staggered-entrance"
      data-disabled={disabled ? "true" : undefined}
      className={cn("staggered-entrance", className)}
      style={staggeredEntranceStyle}
    >
      {entries.map(({ item, content }, index) => {
        const resolvedIndex = reverse ? count - index - 1 : index;
        const key =
          typeof getItemKey === "function"
            ? getItemKey(item, index)
            : getItemKey ?? getFallbackKey(content, index);

        return (
          <StaggeredEntranceItem
            key={key}
            as={itemAs}
            index={resolvedIndex + staggerOffset}
            className={resolveValue(itemClassName, item, index)}
            style={resolveValue(itemStyle, item, index)}
          >
            {content}
          </StaggeredEntranceItem>
        );
      })}
    </Component>
  );
}

export function StaggeredEntranceItem({
  as: Component = "div",
  index,
  className,
  style,
  ...props
}: StaggeredEntranceItemProps) {
  const itemStyle: CssVariableStyle =
    index === undefined
      ? (style as CssVariableStyle)
      : { "--staggered-entrance-index": String(index), ...style };

  return (
    <Component
      {...props}
      data-slot="staggered-entrance-item"
      className={cn("staggered-entrance-item", className)}
      style={itemStyle}
    />
  );
}

function toCssTime(value: number | string) {
  return typeof value === "number" ? `${value}ms` : value;
}

function toCssLength(value: number | string) {
  return typeof value === "number" ? `${value}px` : value;
}

function resolveValue<TItem, TValue>(
  value: TValue | ((item: TItem, index: number) => TValue | undefined),
  item: TItem,
  index: number
) {
  return typeof value === "function"
    ? (value as (item: TItem, index: number) => TValue | undefined)(item, index)
    : value;
}

function getFallbackKey(content: React.ReactNode, index: number) {
  return React.isValidElement(content) && content.key != null
    ? content.key
    : index;
}
