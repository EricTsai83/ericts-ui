"use client";

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

export type RegistryArrangement = "alphabetical" | "category";

type RegistryArrangementToggleProps = {
  value: RegistryArrangement;
  onValueChange: (value: RegistryArrangement) => void;
};

export function RegistryArrangementToggle({
  value,
  onValueChange,
}: RegistryArrangementToggleProps) {
  const handleValueChange = (values: string[]) => {
    const nextValue = values[0];

    if (nextValue === "alphabetical" || nextValue === "category") {
      onValueChange(nextValue);
    }
  };

  return (
    <ToggleGroup
      value={[value]}
      onValueChange={handleValueChange}
      variant="outline"
      size="sm"
      spacing={0}
      aria-label="Arrange items"
    >
      <ToggleGroupItem
        value="alphabetical"
        aria-label="Arrange alphabetically"
        className="w-[4.5rem]"
      >
        Name
      </ToggleGroupItem>
      <ToggleGroupItem
        value="category"
        aria-label="Arrange by category"
        className="w-[4.5rem]"
      >
        Category
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
