import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

const root = process.cwd();
const registryPath = path.join(root, "registry.json");
const displayPath = path.join(root, "lib/registry-display.ts");
const previewPath = path.join(root, "components/registry-preview.tsx");

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
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
validateBrowsablePreviews();
validateRegistryFilesExist();

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

function validateKindCategories() {
  const categoriesByKind = new Map();

  for (const category of displayCategories) {
    if (typeof category.kind !== "string" || typeof category.slug !== "string") {
      continue;
    }

    const categories = categoriesByKind.get(category.kind) ?? new Set();
    categories.add(category.slug);
    categoriesByKind.set(category.kind, categories);
  }

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
