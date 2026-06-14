import { TextHoverEffect } from "@/components/ui/text-hover-effect";
import PokemonPage from "@/registry/new-york/blocks/complex-component/page";
import { ExampleForm } from "@/registry/new-york/blocks/example-form/example-form";
import { ExampleCard } from "@/registry/new-york/blocks/example-with-css/example-card";
import { HelloWorld } from "@/registry/new-york/blocks/hello-world/hello-world";

export function RegistryPreview({ name }: { name: string }) {
  switch (name) {
    case "hello-world":
      return <HelloWorld />;
    case "example-form":
      return <ExampleForm />;
    case "complex-component":
      return <PokemonPage />;
    case "example-with-css":
      return <ExampleCard />;
    case "text-hover-effect":
      return (
        <TextHoverEffect
          text="Hover"
          className="w-full max-w-xl"
          fontSize="text-7xl"
        />
      );
    default:
      return null;
  }
}
