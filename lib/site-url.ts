const DEFAULT_SITE_URL = "https://ui.ericts.com";

export function getSiteUrl() {
  const siteUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    DEFAULT_SITE_URL;

  const url = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;

  return url.replace(/\/$/, "");
}

export function getRegistryItemUrl(name: string) {
  return `${getSiteUrl()}/r/${name}.json`;
}
