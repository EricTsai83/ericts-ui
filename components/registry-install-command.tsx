"use client";

import { Terminal } from "lucide-react";
import { useState } from "react";

import {
  getRegistryInstallTarget,
  type RegistryInstallMode,
} from "@/lib/registry-install";
import {
  DEFAULT_PACKAGE_MANAGER,
  getRegistryInstallCommand,
  packageManagers,
  type PackageManager,
} from "@/lib/registry-install-command";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/registry/base/ui/copy-button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const packageManagerValues = new Set<string>(packageManagers);

function isPackageManager(value: string): value is PackageManager {
  return packageManagerValues.has(value);
}

export function RegistryInstallCommand({
  name,
  className,
  mode = "namespace",
  defaultPackageManager = DEFAULT_PACKAGE_MANAGER,
}: {
  name: string;
  className?: string;
  mode?: RegistryInstallMode;
  defaultPackageManager?: PackageManager;
}) {
  const [packageManager, setPackageManager] = useState<PackageManager>(
    defaultPackageManager,
  );
  const installTarget = getRegistryInstallTarget(name, mode);
  const command = getRegistryInstallCommand(installTarget, packageManager);

  return (
    <div
      className={cn(
        "relative min-w-0 max-w-full overflow-hidden rounded-xl bg-muted/50 text-sm",
        className,
      )}
    >
      <Tabs
        value={packageManager}
        className="gap-0"
        onValueChange={(value) => {
          if (isPackageManager(value)) {
            setPackageManager(value);
          }
        }}
      >
        <div className="flex items-center gap-2 border-b border-border/50 px-3 py-1">
          <span className="flex size-4 shrink-0 items-center justify-center rounded-[1px] bg-foreground opacity-70">
            <Terminal
              className="size-3 text-background"
              aria-hidden="true"
            />
          </span>
          <TabsList
            aria-label="Package manager"
            className="rounded-none bg-transparent p-0"
          >
            {packageManagers.map((item) => (
              <TabsTrigger
                key={item}
                value={item}
                onClick={() => setPackageManager(item)}
                className="h-7 border border-transparent px-2.5 pt-0.5 shadow-none! data-active:border-input data-active:bg-background!"
              >
                {item}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="no-scrollbar overflow-x-auto">
          {packageManagers.map((item) => {
            const itemCommand = getRegistryInstallCommand(
              installTarget,
              item,
            );

            return (
              <TabsContent
                key={item}
                value={item}
                className="mt-0 min-w-max px-4 py-3.5"
              >
                <pre>
                  <code
                    className="relative border-0 bg-transparent p-0 font-mono text-sm leading-none"
                    data-language="bash"
                  >
                    {itemCommand}
                  </code>
                </pre>
              </TabsContent>
            );
          })}
        </div>
      </Tabs>
      <CopyButton
        value={command}
        variant="ghost"
        className="absolute right-2 top-2 z-10 size-7 opacity-70 hover:opacity-100 focus-visible:opacity-100"
        aria-label="Copy installation command"
        title="Copy command"
      />
    </div>
  );
}
