import { notFound } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";

import { source } from "@/lib/source";

export const dynamic = "force-static";
export const dynamicParams = false;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (!page) {
    notFound();
  }

  return new NextResponse(await page.data.getText("raw"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
