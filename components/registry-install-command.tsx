"use client";

import { Terminal } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { CopyButton } from "@/registry/base/ui/copy-button";

const packageManagers = ["pnpm", "npm", "yarn", "bun"] as const;

type PackageManager = (typeof packageManagers)[number];

const commandPrefix: Record<PackageManager, string> = {
  pnpm: "pnpm dlx",
  npm: "npx",
  yarn: "yarn dlx",
  bun: "bunx --bun",
};

export function getRegistryInstallCommand(
  installTarget: string,
  packageManager: PackageManager,
) {
  return `${commandPrefix[packageManager]} shadcn@latest add ${installTarget}`;
}

export function RegistryInstallCommand({
  installTarget,
  className,
}: {
  installTarget: string;
  className?: string;
}) {
  const [packageManager, setPackageManager] = useState<PackageManager>("pnpm");
  const command = getRegistryInstallCommand(installTarget, packageManager);

  return (
    <div
      className={cn(
        "min-w-0 max-w-full overflow-hidden rounded-xl bg-muted/50",
        className,
      )}
    >
      <div className="flex min-h-11 items-center gap-3 border-b px-3">
        <Terminal
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <div className="flex flex-wrap items-center gap-1">
          {packageManagers.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPackageManager(item)}
              data-active={packageManager === item}
              className="inline-flex h-7 items-center rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[active=true]:border data-[active=true]:bg-background data-[active=true]:text-foreground"
            >
              {item}
            </button>
          ))}
        </div>
        <CopyButton
          value={command}
          variant="ghost"
          className="ml-auto"
          aria-label="Copy installation command"
          title="Copy command"
        />
      </div>
      <pre className="no-scrollbar max-w-full overflow-x-auto px-4 py-4 text-sm">
        <code className="font-mono">{command}</code>
      </pre>
    </div>
  );
}
