#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CODE_FILE_RE = /\.(?:ts|tsx|js|jsx|mjs|cjs)$/;
const LAYERS = new Set(["app", "modules", "core", "shared", "integrations"]);

const FORBIDDEN_RUNTIME_TARGETS = {
  app: new Set(),
  modules: new Set(["app"]),
  core: new Set(["app", "modules"]),
  shared: new Set(["app", "modules", "core", "integrations"]),
  integrations: new Set(["app", "modules", "core"]),
};

function normalize(value) {
  return value.replace(/\\/g, "/");
}

function maskComments(source) {
  let result = "";
  let state = "code";

  for (let index = 0; index < source.length; index += 1) {
    const current = source[index];
    const next = source[index + 1];

    if (state === "line-comment") {
      if (current === "\n") {
        state = "code";
        result += current;
      } else {
        result += " ";
      }
      continue;
    }

    if (state === "block-comment") {
      if (current === "*" && next === "/") {
        result += "  ";
        index += 1;
        state = "code";
      } else {
        result += current === "\n" ? "\n" : " ";
      }
      continue;
    }

    if (state === "single-quote" || state === "double-quote" || state === "template") {
      result += current;
      if (current === "\\") {
        if (next !== undefined) {
          result += next;
          index += 1;
        }
        continue;
      }
      if (
        (state === "single-quote" && current === "'")
        || (state === "double-quote" && current === '"')
        || (state === "template" && current === "`")
      ) {
        state = "code";
      }
      continue;
    }

    if (current === "/" && next === "/") {
      result += "  ";
      index += 1;
      state = "line-comment";
      continue;
    }
    if (current === "/" && next === "*") {
      result += "  ";
      index += 1;
      state = "block-comment";
      continue;
    }
    if (current === "'") state = "single-quote";
    if (current === '"') state = "double-quote";
    if (current === "`") state = "template";
    result += current;
  }

  return result;
}

function collectMatches(source, regex, typeOnly, kind, references) {
  for (const match of source.matchAll(regex)) {
    references.push({
      specifier: match[1],
      typeOnly,
      kind,
    });
  }
}

export function extractImportReferences(source) {
  const content = maskComments(source);
  const references = [];

  collectMatches(
    content,
    /\bimport\s+type\s+[\s\S]*?\s+from\s*["']([^"']+)["']/g,
    true,
    "import-type",
    references,
  );
  collectMatches(
    content,
    /\bexport\s+type\s+(?:\*|\{[\s\S]*?\})\s+from\s*["']([^"']+)["']/g,
    true,
    "export-type",
    references,
  );
  collectMatches(
    content,
    /\bimport\s+(?!type\b)(?:[\s\S]*?\s+from\s*)?["']([^"']+)["']/g,
    false,
    "import",
    references,
  );
  collectMatches(
    content,
    /\bexport\s+(?!type\b)(?:\*|\{[\s\S]*?\})\s+from\s*["']([^"']+)["']/g,
    false,
    "export",
    references,
  );
  collectMatches(
    content,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    false,
    "dynamic-import",
    references,
  );

  const deduped = new Map();
  for (const reference of references) {
    const key = `${reference.kind}|${reference.typeOnly}|${reference.specifier}`;
    deduped.set(key, reference);
  }
  return [...deduped.values()];
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist", "build", "coverage"].includes(entry.name)) {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile() && CODE_FILE_RE.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function layerFromPath(rootDir, filePath) {
  const relativePath = normalize(path.relative(rootDir, filePath));
  const match = relativePath.match(/^src\/(app|modules|core|shared|integrations)(?:\/|$)/);
  return match?.[1] ?? null;
}

function layerFromAlias(specifier) {
  const match = specifier.match(/^@\/(app|modules|core|shared|integrations)(?:\/|$)/);
  return match?.[1] ?? null;
}

function resolveRelativeTarget(rootDir, sourceFile, specifier) {
  if (!specifier.startsWith(".")) return null;

  const unresolved = path.resolve(path.dirname(sourceFile), specifier);
  const candidates = CODE_FILE_RE.test(unresolved)
    ? [unresolved]
    : [
        unresolved,
        `${unresolved}.ts`,
        `${unresolved}.tsx`,
        `${unresolved}.js`,
        `${unresolved}.jsx`,
        `${unresolved}.mjs`,
        `${unresolved}.cjs`,
        path.join(unresolved, "index.ts"),
        path.join(unresolved, "index.tsx"),
        path.join(unresolved, "index.js"),
        path.join(unresolved, "index.jsx"),
      ];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    const relativePath = normalize(path.relative(rootDir, candidate));
    if (relativePath.startsWith("../") || path.isAbsolute(relativePath)) continue;
    return candidate;
  }
  return null;
}

export function collectReverseLayerViolations(rootDir = process.cwd()) {
  const srcDir = path.join(rootDir, "src");
  const violations = [];

  for (const sourceFile of walk(srcDir)) {
    const sourceLayer = layerFromPath(rootDir, sourceFile);
    if (!sourceLayer) continue;

    const content = fs.readFileSync(sourceFile, "utf8");
    for (const reference of extractImportReferences(content)) {
      if (reference.typeOnly) continue;

      let targetLayer = layerFromAlias(reference.specifier);
      let targetFile = null;

      if (!targetLayer && reference.specifier.startsWith(".")) {
        targetFile = resolveRelativeTarget(rootDir, sourceFile, reference.specifier);
        if (targetFile) targetLayer = layerFromPath(rootDir, targetFile);
      }

      if (!targetLayer || targetLayer === sourceLayer) continue;
      if (!FORBIDDEN_RUNTIME_TARGETS[sourceLayer].has(targetLayer)) continue;

      violations.push({
        kind: "reverse-layer-runtime-import",
        file: normalize(path.relative(rootDir, sourceFile)),
        sourceLayer,
        targetLayer,
        specifier: reference.specifier,
        importKind: reference.kind,
        resolvedTarget: targetFile ? normalize(path.relative(rootDir, targetFile)) : null,
        message: `Runtime dependency reversa: ${sourceLayer} -> ${targetLayer}`,
      });
    }
  }

  return violations.sort((a, b) =>
    `${a.file}|${a.specifier}|${a.importKind}`.localeCompare(
      `${b.file}|${b.specifier}|${b.importKind}`,
    ),
  );
}

function main() {
  const jsonOutput = process.argv.includes("--json");
  const violations = collectReverseLayerViolations();

  if (jsonOutput) {
    console.log(JSON.stringify(violations, null, 2));
  } else if (violations.length === 0) {
    console.log("Reverse-layer runtime imports: nenhum item.");
  } else {
    console.error(`Reverse-layer runtime imports: ${violations.length}`);
    for (const violation of violations) {
      console.error(
        `- ${violation.file}: ${violation.sourceLayer} -> ${violation.targetLayer} via ${violation.specifier}`,
      );
    }
  }

  if (violations.length > 0) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
