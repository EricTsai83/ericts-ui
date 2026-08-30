"use client";

import { MermaidDiagram } from "@/registry/base/blocks/mermaid-diagram";

const chart = `flowchart LR
  Source[Markdown source] --> Parse{Mermaid parser}
  Parse -->|valid| Render[Accessible SVG]
  Parse -->|invalid| Repair[Repair workflow]
  Render --> View[Pan, zoom & fullscreen]
  Repair --> Source`;

export default function Preview({
  presentation = "inline",
}: {
  variant: string;
  presentation?: "inline" | "fullscreen";
}) {
  return (
    <div className="flex size-full min-h-[28rem] items-center justify-center bg-muted/30 p-4 sm:p-8">
      <MermaidDiagram
        chart={chart}
        title="Diagram rendering pipeline"
        caption="A complete Mermaid rendering surface with safe defaults and an interactive fullscreen view."
        className="my-0 w-full max-w-4xl shadow-sm"
        classNames={{
          viewport:
            presentation === "fullscreen" ? "min-h-[30rem]" : "min-h-72",
        }}
      />
    </div>
  );
}
