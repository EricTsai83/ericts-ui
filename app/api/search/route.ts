import { createFromSource } from "fumadocs-core/search/server";

import { searchRegistryItems } from "@/lib/component-search";
import { source } from "@/lib/source";

const search = createFromSource(source);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("query");

  if (!query) {
    return Response.json([]);
  }

  const [docsResults, registryResults] = await Promise.all([
    search.search(query, readSearchOptions(url)),
    searchRegistryItems(query),
  ]);

  return Response.json([...registryResults, ...docsResults]);
}

function readSearchOptions(url: URL) {
  const limit = url.searchParams.has("limit")
    ? Number(url.searchParams.get("limit"))
    : undefined;
  const tag = url.searchParams.get("tag");

  return {
    locale: url.searchParams.get("locale"),
    tag: tag ? tag.split(",") : undefined,
    limit: Number.isInteger(limit) ? limit : undefined,
    mode: url.searchParams.get("mode") === "vector" ? "vector" : "full",
  } as const;
}
