"use client";

import Image from "next/image";
import { ArrowDown, ArrowRight, FileText, Scan } from "lucide-react";

import { ReplayablePreview } from "@/components/previews/replayable-preview";
import { ScanReveal } from "@/registry/base/ui/scan-reveal";

function ProductImage({ analyzed = false }: { analyzed?: boolean }) {
  return (
    <div className="relative h-72 overflow-hidden bg-muted">
      {/* Center the subject, rather than the full photograph's empty space. */}
      <div className="absolute top-1/2 left-1/2 aspect-[1672/941] w-[200%] min-w-[36rem] -translate-x-[69.5%] -translate-y-[46.7%]">
        <Image
          src="/images/scroll-expand-watch-hero.png"
          alt={
            analyzed
              ? "Watch identified in a product photograph"
              : "Original product photograph"
          }
          fill
          sizes="(min-width: 768px) 800px, 200vw"
          className="object-cover"
        />
      </div>
      {analyzed && (
        <div className="absolute inset-y-5 right-[22%] left-[22%] rounded-lg border border-ericts-media-control-foreground/80 text-ericts-media-control-foreground">
          <div className="absolute -top-3 left-2 rounded-md bg-ericts-media-control px-2 py-1 font-mono text-xs text-ericts-media-control-foreground">
            Watch
          </div>
          <span className="absolute bottom-2 left-2 rounded bg-ericts-media-control/80 px-2 py-1 text-xs text-ericts-media-control-foreground">
            Product detected
          </span>
        </div>
      )}
    </div>
  );
}

const fields = [
  { label: "Merchant", value: "Northline Studio" },
  { label: "Invoice date", value: "18 Oct 2026" },
  { label: "Amount due", value: "$128.00 USD" },
];

function Invoice({ analyzed = false }: { analyzed?: boolean }) {
  return (
    <div className="flex h-72 flex-col justify-between bg-background px-5 py-6">
      <div className="flex items-center justify-between border-b pb-3">
        <span className="font-mono text-xs tracking-wider text-muted-foreground">
          INVOICE
        </span>
        <span className="text-xs text-muted-foreground">#0084</span>
      </div>
      <dl className="flex flex-1 flex-col justify-evenly">
        {fields.map(({ label, value }) => (
          <div
            key={label}
            className="relative rounded-md border border-transparent px-2 py-2"
          >
            {analyzed && (
              <span
                aria-hidden
                className="absolute -inset-px rounded-md border border-dashed border-foreground/40 bg-foreground/5"
              />
            )}
            <dt className="relative mb-1 text-xs text-muted-foreground">
              {analyzed ? `${label} · matched` : label}
            </dt>
            <dd className="relative text-sm font-medium tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function Preview() {
  return (
    <ReplayablePreview>
      {(replayKey) => (
        <div className="grid w-full max-w-3xl grid-cols-1 gap-8 md:grid-cols-2 md:gap-6">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <p className="text-sm font-medium tracking-tight">
                Product tagging
              </p>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Horizontal <ArrowRight className="size-3" aria-hidden />
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
              <div className="flex items-center gap-2 border-b bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
                <Scan className="size-4" aria-hidden />
                Asset library / product-01.png
              </div>
              <ScanReveal
                key={`product-${replayKey}`}
                direction="horizontal"
                duration={1800}
                before={<ProductImage />}
                beamClassName="text-ericts-media-control-foreground"
              >
                <ProductImage analyzed />
              </ScanReveal>
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <p className="text-sm font-medium tracking-tight">
                Invoice review
              </p>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Vertical <ArrowDown className="size-3" aria-hidden />
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
              <div className="flex items-center gap-2 border-b bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
                <FileText className="size-4" aria-hidden />
                Accounts payable / invoice-0084.pdf
              </div>
              <ScanReveal
                key={`invoice-${replayKey}`}
                direction="vertical"
                duration={1800}
                before={<Invoice />}
              >
                <Invoice analyzed />
              </ScanReveal>
            </div>
          </div>
        </div>
      )}
    </ReplayablePreview>
  );
}
