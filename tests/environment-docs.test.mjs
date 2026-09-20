import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const srcRoot = resolve(root, "src");

function sorted(values) {
  return [...values].sort();
}

function relativeImports(source) {
  const imports = [];
  const pattern = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["'](\.[^"']+)["']/g;
  for (const match of source.matchAll(pattern)) imports.push(match[1]);
  for (const match of source.matchAll(/import\(\s*["'](\.[^"']+)["']\s*\)/g)) {
    imports.push(match[1]);
  }
  return imports;
}

function resolveImport(fromFile, specifier) {
  const candidate = resolve(dirname(fromFile), specifier.replace(/\.js$/, ".ts"));
  if (existsSync(candidate)) return candidate;
  if (existsSync(`${candidate}.ts`)) return `${candidate}.ts`;
  return undefined;
}

function reachableFiles(entrypoint) {
  const pending = [resolve(srcRoot, entrypoint)];
  const visited = new Set();

  while (pending.length > 0) {
    const file = pending.pop();
    if (!file || visited.has(file)) continue;
    visited.add(file);

    const source = readFileSync(file, "utf8");
    for (const specifier of relativeImports(source)) {
      const importedFile = resolveImport(file, specifier);
      if (importedFile && !visited.has(importedFile)) pending.push(importedFile);
    }
  }

  return visited;
}

function environmentVariables(files) {
  const variables = new Set();
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const pattern =
      /\b(?:process\.env(?:\.([A-Z][A-Z0-9_]*)|\[["']([A-Z][A-Z0-9_]*)["']\])|env\.([A-Z][A-Z0-9_]*))/g;
    for (const match of source.matchAll(pattern)) {
      variables.add(match[1] ?? match[2] ?? match[3]);
    }
  }
  return variables;
}

function difference(left, right) {
  return new Set([...left].filter((value) => !right.has(value)));
}

function intersection(left, right) {
  return new Set([...left].filter((value) => right.has(value)));
}

function markdownSection(markdown, start, end) {
  const startIndex = markdown.indexOf(start);
  assert.notEqual(startIndex, -1, `README is missing ${start}`);
  if (!end) return markdown.slice(startIndex);
  const endIndex = markdown.indexOf(end, startIndex + start.length);
  assert.notEqual(endIndex, -1, `README is missing ${end}`);
  return markdown.slice(startIndex, endIndex);
}

function documentedVariables(markdown) {
  return new Set([...markdown.matchAll(/`([A-Z][A-Z0-9_]*)`/g)].map((match) => match[1]));
}

const publicVariables = environmentVariables(reachableFiles("index.ts"));
const opsVariables = environmentVariables(reachableFiles("ops.ts"));
const sharedVariables = intersection(publicVariables, opsVariables);
const publicOnlyVariables = difference(publicVariables, opsVariables);
const opsOnlyVariables = difference(opsVariables, publicVariables);
const runtimeVariables = new Set([...publicVariables, ...opsVariables]);

const envExample = readFileSync(resolve(root, ".env.example"), "utf8");
const envExampleVariables = new Set(
  [...envExample.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((match) => match[1]),
);

const readme = readFileSync(resolve(root, "README.md"), "utf8");
const environmentSection = markdownSection(readme, "## Environment variables", "## Tools");
const sharedSection = markdownSection(
  environmentSection,
  "### Shared by both binaries",
  "### Public server",
);
const publicSection = markdownSection(
  environmentSection,
  "### Public server",
  "### Operations server",
);
const opsSection = markdownSection(environmentSection, "### Operations server");

test(".env.example exactly covers the variables used by both entrypoints", () => {
  assert.deepEqual(sorted(envExampleVariables), sorted(runtimeVariables));
});

test("the README documents every supported variable and no unsupported ones", () => {
  assert.deepEqual(sorted(documentedVariables(environmentSection)), sorted(runtimeVariables));
});

test("the README assigns variables to the server that can read them", () => {
  assert.deepEqual(sorted(documentedVariables(sharedSection)), sorted(sharedVariables));
  assert.deepEqual(sorted(documentedVariables(publicSection)), sorted(publicOnlyVariables));
  assert.deepEqual(sorted(documentedVariables(opsSection)), sorted(opsOnlyVariables));
});

test("the MCP Registry entry does not advertise ops-only configuration", () => {
  const serverJson = JSON.parse(readFileSync(resolve(root, "server.json"), "utf8"));
  const registryVariables = new Set(
    serverJson.packages.flatMap((entry) =>
      (entry.environmentVariables ?? []).map((variable) => variable.name),
    ),
  );

  assert.deepEqual(
    sorted(intersection(registryVariables, opsOnlyVariables)),
    [],
    "server.json advertises variables that only molecare-ops-mcp reads",
  );
  assert.deepEqual(
    sorted(difference(registryVariables, publicVariables)),
    [],
    "server.json advertises variables that the public server cannot read",
  );
});
