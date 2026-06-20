import * as React from "react";

import { cn } from "@/lib/utils";

import "./orchestration.css";

type CssVariableStyle = React.CSSProperties & Record<`--${string}`, string>;
type OrchestrationAxis = "x" | "y";
type OrchestrationKey<TItem> =
  | React.Key
  | ((item: TItem, index: number) => React.Key);
type OrchestrationClassName<TItem> =
  | string
  | ((item: TItem, index: number) => string | undefined);
type OrchestrationStyle<TItem> =
  | React.CSSProperties
  | ((item: TItem, index: number) => React.CSSProperties | undefined);

export type OrchestrationProps<TItem = React.ReactNode> = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "children"
> & {
  as?: React.ElementType;
  itemAs?: React.ElementType;
  children?: React.ReactNode;
  items?: readonly TItem[];
  renderItem?: (item: TItem, index: number) => React.ReactNode;
  getItemKey?: OrchestrationKey<TItem>;
  delay?: number | string;
  duration?: number | string;
  initialDelay?: number | string;
  staggerOffset?: number;
  axis?: OrchestrationAxis;
  distance?: number | string;
  scale?: number;
  opacity?: number;
  reverse?: boolean;
  disabled?: boolean;
  itemClassName?: OrchestrationClassName<TItem>;
  itemStyle?: OrchestrationStyle<TItem>;
};

export type OrchestrationItemProps = React.ComponentPropsWithoutRef<"div"> & {
  as?: React.ElementType;
  index?: number;
};

export function Orchestration<TItem = React.ReactNode>({
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
}: OrchestrationProps<TItem>) {
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
  const orchestrationStyle: CssVariableStyle = {
    "--orchestration-delay": toCssTime(delay),
    "--orchestration-duration": toCssTime(duration),
    "--orchestration-initial-delay": toCssTime(initialDelay),
    "--orchestration-from-x": axis === "x" ? resolvedDistance : "0px",
    "--orchestration-from-y": axis === "y" ? resolvedDistance : "0px",
    "--orchestration-from-scale": String(scale),
    "--orchestration-from-opacity": String(opacity),
    ...style,
  };

  return (
    <Component
      {...props}
      data-slot="orchestration"
      data-disabled={disabled ? "true" : undefined}
      className={cn("orchestration", className)}
      style={orchestrationStyle}
    >
      {entries.map(({ item, content }, index) => {
        const resolvedIndex = reverse ? count - index - 1 : index;
        const key =
          typeof getItemKey === "function"
            ? getItemKey(item, index)
            : getItemKey ?? getFallbackKey(content, index);

        return (
          <OrchestrationItem
            key={key}
            as={itemAs}
            index={resolvedIndex + staggerOffset}
            className={resolveValue(itemClassName, item, index)}
            style={resolveValue(itemStyle, item, index)}
          >
            {content}
          </OrchestrationItem>
        );
      })}
    </Component>
  );
}

export function OrchestrationItem({
  as: Component = "div",
  index,
  className,
  style,
  ...props
}: OrchestrationItemProps) {
  const itemStyle: CssVariableStyle =
    index === undefined
      ? (style as CssVariableStyle)
      : { "--orchestration-index": String(index), ...style };

  return (
    <Component
      {...props}
      data-slot="orchestration-item"
      className={cn("orchestration-item", className)}
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
