/**
 * Shared walker for the CSS-only variant import graph. Both the site
 * (lib/registry-code.tsx) and the validator
 * (scripts/validate-registry-display.mjs) resolve a css-only entry file to the
 * full set of sibling files it needs, so the logic lives in one place — a
 * variant the validator accepts is exactly the one the site renders.
 *
 * Only bare kebab-case siblings inside registry/base/css-only are followed;
 * anything with a path segment or unexpected characters is ignored, which
 * keeps reads confined to that directory.
 */

const CSS_ONLY_NAME_PATTERN = /^[a-z0-9-]+$/;

const LOCAL_IMPORT_PATTERN = /(?:from\s+|import\s+)["']\.\/([^"']+)["']/g;

function baseName(importPath) {
  return importPath.slice(importPath.lastIndexOf("/") + 1);
}

export function parseLocalImports(source) {
  return [...source.matchAll(LOCAL_IMPORT_PATTERN)].map((match) => match[1]);
}

/**
 * Walk the local import graph starting from `${entryName}.tsx`.
 *
 * `readSource(fileName)` resolves a file name (never a path) to its source, or
 * a falsy value when the file does not exist. It may be sync or async.
 *
 * Returns a Map of fileName -> source in display order: the entry file first,
 * then its dependencies in discovery order.
 */
export async function collectCssOnlyGraph(entryName, readSource) {
  const files = new Map();

  await walk(entryName, readSource, files, new Set());

  return files;
}

async function walk(name, readSource, files, visited) {
  if (visited.has(name) || !CSS_ONLY_NAME_PATTERN.test(name)) return;

  visited.add(name);
  const tsxName = `${name}.tsx`;
  const source = await readSource(tsxName);

  if (!source) return;

  files.set(tsxName, source);

  for (const localImport of parseLocalImports(source)) {
    if (localImport.endsWith(".css")) {
      const cssName = baseName(localImport);

      if (!CSS_ONLY_NAME_PATTERN.test(cssName.replace(/\.css$/, ""))) continue;

      if (!files.has(cssName)) {
        const cssSource = await readSource(cssName);

        if (cssSource) files.set(cssName, cssSource);
      }
    } else {
      await walk(
        baseName(localImport).replace(/\.tsx$/, ""),
        readSource,
        files,
        visited,
      );
    }
  }
}
