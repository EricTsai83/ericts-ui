import PokemonPage from "@/registry/base/blocks/complex-component/page";
import { ExampleForm } from "@/registry/base/blocks/example-form/example-form";
import { ExampleCard } from "@/registry/base/blocks/example-with-css/example-card";
import { HelloWorld } from "@/registry/base/blocks/hello-world/hello-world";

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
    default:
      return null;
  }
}
