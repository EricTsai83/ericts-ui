import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { SearchLink } from "fumadocs-ui/contexts/search";
import { RootProvider } from "fumadocs-ui/provider/next";
import "./globals.css";

import { DocsSearchDialog } from "@/components/docs-search";
import { primaryNavItems } from "@/lib/navigation";
import { siteConfig, siteOgImage } from "@/lib/site-config";
import { source } from "@/lib/source";
import { ThemeShortcut } from "@/components/theme-shortcut";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  metadataBase: new URL(siteConfig.url),
  description: siteConfig.description,
  authors: [{ name: "Eric Tsai", url: siteConfig.url }],
  creator: "Eric Tsai",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteOgImage.path,
        width: siteOgImage.width,
        height: siteOgImage.height,
        alt: siteOgImage.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteOgImage.path],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

const searchLinks = getSearchLinks();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col bg-background text-foreground antialiased`}
      >
        <RootProvider
          search={{
            SearchDialog: DocsSearchDialog,
            links: searchLinks,
            options: {
              api: "/api/search",
            },
          }}
        >
          <ThemeShortcut />
          {children}
        </RootProvider>
      </body>
    </html>
  );
}

function getSearchLinks(): SearchLink[] {
  const docsLinks = source.getPages().map((page) => [
    page.data.title ?? page.url,
    page.url,
  ] satisfies SearchLink);
  const links = [
    ...primaryNavItems.map(
      (item) => [item.label, item.href] satisfies SearchLink,
    ),
    ...docsLinks,
  ];
  const seen = new Set<string>();

  return links.filter(([, href]) => {
    if (seen.has(href)) {
      return false;
    }

    seen.add(href);
    return true;
  });
}
