export const packageManagers = ["pnpm", "npm", "yarn", "bun"] as const;

export type PackageManager = (typeof packageManagers)[number];

export const DEFAULT_PACKAGE_MANAGER: PackageManager = "pnpm";

const commandPrefix: Record<PackageManager, string> = {
  pnpm: "pnpm dlx",
  npm: "npx",
  yarn: "yarn dlx",
  bun: "bunx --bun",
};

const packageAddCommandPrefix: Record<PackageManager, string> = {
  pnpm: "pnpm add",
  npm: "npm install",
  yarn: "yarn add",
  bun: "bun add",
};

export function getRegistryInstallCommand(
  installTarget: string,
  packageManager: PackageManager = DEFAULT_PACKAGE_MANAGER,
) {
  return `${commandPrefix[packageManager]} shadcn@latest add ${installTarget}`;
}

export function getPackageInstallCommand(
  dependencies: string[],
  packageManager: PackageManager = DEFAULT_PACKAGE_MANAGER,
) {
  return `${packageAddCommandPrefix[packageManager]} ${dependencies.join(" ")}`;
}
