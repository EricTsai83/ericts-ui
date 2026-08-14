import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

const root = process.cwd();
const canonicalRegistryUrl = "https://ui.ericts.com";
const canonicalRegistryItemUrlPrefix = `${canonicalRegistryUrl}/r/`;
const legacyVercelRegistryUrl = "https://ericts-ui.vercel.app";
const registryPath = path.join(root, "registry.json");
const publishedRegistryPath = path.join(root, "public/r/registry.json");
const displayPath = path.join(root, "lib/registry-display.ts");
const previewPath = path.join(root, "components/registry-preview.tsx");

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
const publishedRegistry = JSON.parse(fs.readFileSync(publishedRegistryPath, "utf8"));
const displaySource = readSourceFile(displayPath);
const previewSource = readSourceFile(previewPath);
const displayConfigs = readObjectArray(displaySource, "registryDisplayItemConfigs");
const displayCategories = readObjectArray(
  displaySource,
  "registryDisplayCategories",
);
const previewNames = new Set(readObjectMapKeys(previewSource, "previews"));
const errors = [];

validateDuplicateDisplayNames();
validateCategorySlugs();
validateRegistryCoverage("registry:ui", "component");
validateRegistryCoverage("registry:hook", "hook");
validateRegistryCoverage("registry:block", "block");
validateDisplayItemsExist();
validateDisplayKindsMatchRegistry();
validateKindCategories();
validatePrimaryCategoryAlignment();
validateCategoriesAreOccupied();
validateTitlesMatchNames();
validateBrowsablePreviews();
validateRegistryFilesExist();
validateCssOnlyVariants();
validatePublishedOutput();
validateCanonicalRegistryUrls();

if (errors.length > 0) {
  console.error("Registry display validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Registry display validation passed.");

function validateDuplicateDisplayNames() {
  const names = new Set();

  for (const config of displayConfigs) {
    if (typeof config.name !== "string") {
      errors.push("Display config is missing a string name.");
      continue;
    }

    if (names.has(config.name)) {
      errors.push(`Duplicate display config name: ${config.name}`);
    }

    names.add(config.name);
  }
}

function validateCategorySlugs() {
  const seen = new Set();
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  for (const category of displayCategories) {
    if (typeof category.slug !== "string") {
      errors.push("Display category is missing a string slug.");
      continue;
    }

    if (!slugPattern.test(category.slug)) {
      errors.push(`Invalid category slug: ${category.slug}`);
    }

    const categoryKey = `${category.kind}:${category.slug}`;

    if (seen.has(categoryKey)) {
      errors.push(`Duplicate display category: ${categoryKey}`);
    }

    seen.add(categoryKey);
  }
}

function validateRegistryCoverage(type, kind) {
  const registryNames = registry.items
    .filter((item) => item.type === type)
    .map((item) => item.name);
  const displayNames = new Set(
    displayConfigs
      .filter((config) => config.kind === kind)
      .map((config) => config.name),
  );

  for (const name of registryNames) {
    if (!displayNames.has(name)) {
      errors.push(`Missing ${kind} display config for ${name}.`);
    }
  }
}

function validateDisplayItemsExist() {
  const registryNames = new Set(registry.items.map((item) => item.name));

  for (const config of displayConfigs) {
    if (typeof config.name === "string" && !registryNames.has(config.name)) {
      errors.push(`Display config references unknown registry item: ${config.name}`);
    }
  }
}

function validateDisplayKindsMatchRegistry() {
  const registryItemsByName = new Map(
    registry.items.map((item) => [item.name, item]),
  );

  for (const config of displayConfigs) {
    const registryItem = registryItemsByName.get(config.name);

    if (!registryItem) {
      continue;
    }

    const expectedKind = getExpectedKind(registryItem.type);

    if (expectedKind && config.kind !== expectedKind) {
      errors.push(
        `Display config ${config.name} uses kind ${config.kind}, expected ${expectedKind}.`,
      );
    }
  }
}

function getExpectedKind(type) {
  if (type === "registry:ui") {
    return "component";
  }

  if (type === "registry:hook") {
    return "hook";
  }

  if (type === "registry:block") {
    return "block";
  }

  return undefined;
}

function getCategorySlugsByKind() {
  const categoriesByKind = new Map();

  for (const category of displayCategories) {
    if (typeof category.kind !== "string" || typeof category.slug !== "string") {
      continue;
    }

    const categories = categoriesByKind.get(category.kind) ?? new Set();
    categories.add(category.slug);
    categoriesByKind.set(category.kind, categories);
  }

  return categoriesByKind;
}

function validateKindCategories() {
  const categoriesByKind = getCategorySlugsByKind();

  for (const config of displayConfigs) {
    if (typeof config.kind !== "string" || typeof config.category !== "string") {
      errors.push(`Display config for ${config.name ?? "unknown"} is missing kind/category.`);
      continue;
    }

    if (!categoriesByKind.get(config.kind)?.has(config.category)) {
      errors.push(
        `Display config ${config.name} uses invalid ${config.kind} category: ${config.category}`,
      );
    }
  }
}

/**
 * An item's title must open with its own name, so the two can never describe
 * different components — `text-morph` titled "Morphing Text" and
 * `staggered-entrance` titled "Staggered List" (which also implied it only worked
 * on lists) both drifted this way, and `expandable-modal` titled "Expandable
 * Dialog" disagreed with its own file name.
 *
 * Comparison ignores case and punctuation, so "Multi-Step Flow" satisfies
 * `multi-step` and "useScrollProgress" satisfies `use-scroll-progress`. Trailing
 * words stay legal: a title may qualify the name ("Ripple Scene Gallery"), it
 * just may not contradict it.
 */
function validateTitlesMatchNames() {
  const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

  for (const item of registry.items) {
    if (typeof item.title !== "string" || typeof item.name !== "string") {
      continue;
    }

    if (!normalize(item.title).startsWith(normalize(item.name))) {
      errors.push(
        `Registry item "${item.name}" is titled "${item.title}", which does not open with its name — rename one so they agree.`,
      );
    }
  }
}

/**
 * The published `registry.json` categories and this site's information
 * architecture are one taxonomy, so an item's first category must be its display
 * category. They used to be two uncoordinated vocabularies — 31 slugs against 22,
 * with nothing comparing them — which is how a card labelled "drawer" came to sit
 * under an "Overlays" heading, and how 26 of 42 items drifted apart unnoticed.
 *
 * Extra entries stay legal for genuine cross-filing, but only from the same
 * kind's vocabulary; anything more specific belongs in `meta.tags`.
 */
function validatePrimaryCategoryAlignment() {
  const categoriesByKind = getCategorySlugsByKind();
  const configsByName = new Map(
    displayConfigs.map((config) => [config.name, config]),
  );

  for (const item of registry.items) {
    const config = configsByName.get(item.name);

    if (!config || typeof config.category !== "string") {
      continue;
    }

    const categories = item.categories ?? [];

    if (categories.length === 0) {
      errors.push(
        `Registry item "${item.name}" declares no categories; the first must be its display category (${config.category}).`,
      );
      continue;
    }

    if (categories[0] !== config.category) {
      errors.push(
        `Registry item "${item.name}" lists categories[0] "${categories[0]}" but its display category is "${config.category}" — these are one taxonomy.`,
      );
    }

    for (const extra of categories.slice(1)) {
      if (!categoriesByKind.get(config.kind)?.has(extra)) {
        errors.push(
          `Registry item "${item.name}" lists category "${extra}", which is not a ${config.kind} category — move it to meta.tags.`,
        );
      }
    }
  }
}

/**
 * A category may only exist once something occupies it. The taxonomy had
 * accumulated ten empty buckets copied from a generic app-blocks template
 * (auth, dashboard, commerce, settings…), each advertising a scope this registry
 * never had; they stayed invisible because the navigation drops empty groups, so
 * nothing surfaced the rot. Occupancy counts browsable items only — a category
 * reachable from no page is just as dead as one with no items at all.
 */
function validateCategoriesAreOccupied() {
  const occupied = new Set(
    displayConfigs
      .filter((config) => config.browsable !== false)
      .map((config) => `${config.kind}:${config.category}`),
  );

  for (const category of displayCategories) {
    if (
      typeof category.slug !== "string" ||
      typeof category.kind !== "string"
    ) {
      continue;
    }

    if (!occupied.has(`${category.kind}:${category.slug}`)) {
      errors.push(
        `Display category ${category.kind}:${category.slug} has no browsable items — remove it instead of shipping an empty bucket.`,
      );
    }
  }
}

function validateBrowsablePreviews() {
  for (const config of displayConfigs) {
    if (config.browsable === false) {
      continue;
    }

    if (typeof config.name === "string" && !previewNames.has(config.name)) {
      errors.push(`Browsable display item is missing RegistryPreview: ${config.name}`);
    }
  }
}

function validateRegistryFilesExist() {
  for (const item of registry.items) {
    for (const file of item.files ?? []) {
      if (typeof file.path !== "string") {
        continue;
      }

      if (!fs.existsSync(path.join(root, file.path))) {
        errors.push(`Registry item "${item.name}" declares missing file: ${file.path}`);
      }
    }
  }
}

function validateCssOnlyVariants() {
  for (const item of registry.items) {
    if (item.meta?.cssOnly !== true) {
      continue;
    }

    const cssPath = path.join(root, "registry/base/css-only", `${item.name}.css`);
    const tsxPath = path.join(root, "registry/base/css-only", `${item.name}.tsx`);

    if (!fs.existsSync(cssPath) || !fs.existsSync(tsxPath)) {
      errors.push(
        `Registry item "${item.name}" sets meta.cssOnly but registry/base/css-only/${item.name}.{css,tsx} is missing.`,
      );
    }
  }
}

function validatePublishedOutput() {
  const publicRDir = path.join(root, "public/r");
  const registryNames = new Set(registry.items.map((item) => item.name));

  for (const name of registryNames) {
    const publishedPath = path.join(publicRDir, `${name}.json`);

    if (!fs.existsSync(publishedPath)) {
      errors.push(
        `Registry item "${name}" has no published payload in public/r — run pnpm registry:build.`,
      );
    }
  }

  for (const file of fs.readdirSync(publicRDir)) {
    if (!file.endsWith(".json") || file === "registry.json") {
      continue;
    }

    const name = file.slice(0, -".json".length);

    if (!registryNames.has(name)) {
      errors.push(
        `public/r/${file} does not match any registry item — stale artifact from a rename?`,
      );
    }
  }
}

function validateCanonicalRegistryUrls() {
  if (registry.homepage !== canonicalRegistryUrl) {
    errors.push(`registry.json homepage must be ${canonicalRegistryUrl}.`);
  }

  if (publishedRegistry.homepage !== canonicalRegistryUrl) {
    errors.push(
      `public/r/registry.json homepage must be ${canonicalRegistryUrl} - run pnpm registry:build.`,
    );
  }

  validateRegistryDependencyUrls(registry.items ?? []);
  validateRegistryDependencyUrls(publishedRegistry.items ?? []);
  validatePublishedRegistryDependencyUrls();
  validateLegacyVercelUrls();
}

function validateRegistryDependencyUrls(items) {
  for (const item of items) {
    for (const dependency of item.registryDependencies ?? []) {
      if (typeof dependency !== "string") {
        continue;
      }

      if (
        isRegistryAbsoluteUrl(dependency) &&
        !dependency.startsWith(canonicalRegistryItemUrlPrefix)
      ) {
        errors.push(
          `Registry dependency for "${item.name}" must use ${canonicalRegistryUrl}/r/.`,
        );
      }
    }
  }
}

function validatePublishedRegistryDependencyUrls() {
  const publicRDir = path.join(root, "public/r");

  for (const file of fs.readdirSync(publicRDir)) {
    if (!file.endsWith(".json") || file === "registry.json") {
      continue;
    }

    const payload = JSON.parse(
      fs.readFileSync(path.join(publicRDir, file), "utf8"),
    );

    validateRegistryDependencyUrls([payload]);
  }
}

function isRegistryAbsoluteUrl(value) {
  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return false;
  }

  try {
    const url = new URL(value);

    return (
      url.hostname === "ui.ericts.com" ||
      url.hostname === "ericts-ui.vercel.app"
    );
  } catch {
    return false;
  }
}

function validateLegacyVercelUrls() {
  for (const filePath of getSourceFilesToScan()) {
    const content = fs.readFileSync(filePath, "utf8");

    if (content.includes(legacyVercelRegistryUrl)) {
      errors.push(
        `Found legacy Vercel registry URL in ${path.relative(root, filePath)}: use ${canonicalRegistryUrl}.`,
      );
    }
  }
}

function getSourceFilesToScan() {
  const pathsToScan = ["README.md", "content", "app", "components", "lib", "registry.json"];
  const allowedExtensions = new Set([
    ".css",
    ".js",
    ".json",
    ".md",
    ".mdx",
    ".ts",
    ".tsx",
  ]);
  const files = [];

  for (const relativePath of pathsToScan) {
    const absolutePath = path.join(root, relativePath);

    if (!fs.existsSync(absolutePath)) {
      continue;
    }

    const stats = fs.statSync(absolutePath);

    if (stats.isFile()) {
      files.push(absolutePath);
      continue;
    }

    for (const nestedPath of walkDirectory(absolutePath)) {
      if (allowedExtensions.has(path.extname(nestedPath))) {
        files.push(nestedPath);
      }
    }
  }

  return files;
}

function walkDirectory(directory) {
  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkDirectory(entryPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

function readSourceFile(filePath) {
  return ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

function readObjectArray(sourceFile, variableName) {
  const declaration = findVariableDeclaration(sourceFile, variableName);
  const expression = unwrapExpression(declaration?.initializer);

  if (!expression || !ts.isArrayLiteralExpression(expression)) {
    throw new Error(`Could not read array ${variableName}.`);
  }

  return expression.elements.map((element) => readObjectLiteral(element));
}

function readObjectMapKeys(sourceFile, variableName) {
  const declaration = findVariableDeclaration(sourceFile, variableName);
  const expression = unwrapExpression(declaration?.initializer);

  if (!expression || !ts.isObjectLiteralExpression(expression)) {
    throw new Error(`Could not read object ${variableName}.`);
  }

  return expression.properties
    .map((property) =>
      ts.isPropertyAssignment(property)
        ? readPropertyName(property.name)
        : undefined,
    )
    .filter(Boolean);
}

function findVariableDeclaration(sourceFile, variableName) {
  let found;

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variableName
    ) {
      found = node;
      return;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return found;
}

function readObjectLiteral(node) {
  const expression = unwrapExpression(node);

  if (!expression || !ts.isObjectLiteralExpression(expression)) {
    throw new Error("Expected object literal in display config.");
  }

  const result = {};

  for (const property of expression.properties) {
    if (!ts.isPropertyAssignment(property)) {
      continue;
    }

    const name = readPropertyName(property.name);

    if (!name) {
      continue;
    }

    result[name] = readLiteralValue(property.initializer);
  }

  return result;
}

function readPropertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
    return name.text;
  }

  return undefined;
}

function readLiteralValue(node) {
  const expression = unwrapExpression(node);

  if (!expression) {
    return undefined;
  }

  if (ts.isStringLiteral(expression)) {
    return expression.text;
  }

  if (expression.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }

  if (expression.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }

  return undefined;
}

function unwrapExpression(node) {
  let expression = node;

  while (
    expression &&
    (ts.isAsExpression(expression) || ts.isSatisfiesExpression(expression))
  ) {
    expression = expression.expression;
  }

  return expression;
}
