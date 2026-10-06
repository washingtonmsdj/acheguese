#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";
import * as ts from "typescript";

const ROOT = process.cwd();
const SRC_ROOT = path.join(ROOT, "src");

const ACTIVE_GRAPH_ENTRIES = [
  "src/app/routes/activeLazyImports.ts",
  "src/app/routes/sections/AppLayoutRoutes.tsx",
  "src/app/components/AppLayoutSidebar.tsx",
] as const;

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".css"] as const;
const VISUAL_EXTENSIONS = new Set([".tsx", ".css"]);
const NON_SOURCE_ASSET_RE = /\.(?:avif|gif|ico|jpe?g|json|map|mp3|mp4|pdf|png|svg|webm|webp|woff2?|ttf)$/i;

const RAW_RUNTIME_COLOR_RE = /(?:#[0-9a-fA-F]{3,8}\b|\brgba?\s*\()/;
const LEGACY_FONT_RE = /(?:DM Sans|Space Grotesk|Manrope|Bricolage Grotesk)/;
const DIRECT_RUNTIME_FONT_RE = /\b(?:Arial|Helvetica),?\s*(?:sans-serif)?\b/;
const CSS_FONT_WEIGHT_RE = /font-weight\s*:\s*(\d{3})\b/g;
const ARBITRARY_TAILWIND_WEIGHT_RE = /font-\[(\d{3})\]/g;
const APPROVED_FONT_WEIGHTS = new Set(["400", "500", "600", "700", "800"]);

function toRepoPath(absolute: string): string {
  return path.relative(ROOT, absolute).split(path.sep).join("/");
}

function isInsideSource(absolute: string): boolean {
  const relative = path.relative(SRC_ROOT, absolute);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function candidateFiles(base: string): string[] {
  if (SOURCE_EXTENSIONS.some((extension) => base.endsWith(extension))) {
    return [base];
  }

  return [
    ...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...SOURCE_EXTENSIONS.map((extension) => path.join(base, `index${extension}`)),
  ];
}

function resolveLocalImport(
  importer: string,
  specifier: string,
  violations: string[],
): string | null {
  if (NON_SOURCE_ASSET_RE.test(specifier)) return null;

  let base: string | null = null;
  if (specifier.startsWith("@/")) {
    base = path.join(SRC_ROOT, specifier.slice(2));
  } else if (specifier.startsWith("./") || specifier.startsWith("../")) {
    base = path.resolve(path.dirname(importer), specifier);
  }

  if (!base) return null;

  const resolved = candidateFiles(base).find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );

  if (!resolved) {
    violations.push(
      `${toRepoPath(importer)}: local import ${specifier} could not be resolved by the active visual import-graph gate.`,
    );
    return null;
  }

  if (!isInsideSource(resolved)) {
    violations.push(
      `${toRepoPath(importer)}: local import ${specifier} resolves outside src/, which is not allowed in the active frontend graph.`,
    );
    return null;
  }

  return resolved;
}

function collectTypeScriptSpecifiers(file: string, content: string): string[] {
  const scriptKind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    file,
    content,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
  const specifiers = new Set<string>();

  function visit(node: ts.Node): void {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      specifiers.add(node.moduleSpecifier.text);
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      specifiers.add(node.arguments[0].text);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return [...specifiers];
}

function collectCssSpecifiers(content: string): string[] {
  return Array.from(
    content.matchAll(/@import\s+(?:url\()?\s*["']([^"']+)["']/g),
    (match) => match[1],
  );
}

function collectSpecifiers(file: string, content: string): string[] {
  if (file.endsWith(".css")) return collectCssSpecifiers(content);
  return collectTypeScriptSpecifiers(file, content);
}

function collectActiveGraph(violations: string[]): Set<string> {
  const pending: string[] = [];
  const visited = new Set<string>();

  for (const relative of ACTIVE_GRAPH_ENTRIES) {
    const absolute = path.join(ROOT, relative);
    if (!fs.existsSync(absolute)) {
      violations.push(`${relative}: required active frontend graph entry is missing.`);
      continue;
    }
    pending.push(absolute);
  }

  while (pending.length > 0) {
    const current = pending.pop()!;
    const normalized = path.resolve(current);
    if (visited.has(normalized)) continue;
    visited.add(normalized);

    const content = fs.readFileSync(normalized, "utf8");
    for (const specifier of collectSpecifiers(normalized, content)) {
      const resolved = resolveLocalImport(normalized, specifier, violations);
      if (resolved && !visited.has(resolved)) pending.push(resolved);
    }
  }

  return visited;
}

function stripComments(relative: string, content: string): string {
  if (relative.endsWith(".css")) {
    return content.replace(/\/\*[\s\S]*?\*\//g, "");
  }

  return content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function validateApprovedFontWeights(
  relative: string,
  content: string,
  violations: string[],
): void {
  for (const regex of [CSS_FONT_WEIGHT_RE, ARBITRARY_TAILWIND_WEIGHT_RE]) {
    regex.lastIndex = 0;
    for (const match of content.matchAll(regex)) {
      const weight = match[1];
      if (!APPROVED_FONT_WEIGHTS.has(weight)) {
        violations.push(
          `${relative}: unsupported font weight ${weight} in the active frontend graph; approved loaded weights are 400, 500, 600, 700 and 800.`,
        );
      }
    }
  }
}

function main(): void {
  const violations: string[] = [];
  const graph = collectActiveGraph(violations);
  const visualFiles = [...graph]
    .filter((absolute) => VISUAL_EXTENSIONS.has(path.extname(absolute)))
    .sort();

  for (const absolute of visualFiles) {
    const relative = toRepoPath(absolute);
    const content = stripComments(relative, fs.readFileSync(absolute, "utf8"));

    if (RAW_RUNTIME_COLOR_RE.test(content)) {
      violations.push(
        `${relative}: raw runtime color found in a component/CSS reachable from the active MVP; use semantic SSOT tokens instead.`,
      );
    }
    if (LEGACY_FONT_RE.test(content)) {
      violations.push(
        `${relative}: legacy font found in a component/CSS reachable from the active MVP; use Plus Jakarta Sans through the canonical typography SSOT.`,
      );
    }
    if (DIRECT_RUNTIME_FONT_RE.test(content)) {
      violations.push(
        `${relative}: direct Arial/Helvetica runtime font stack found in the active MVP graph; consume the canonical font token instead.`,
      );
    }

    validateApprovedFontWeights(relative, content, violations);
  }

  if (visualFiles.length === 0) {
    violations.push("Active frontend import graph resolved zero visual files; the gate is not proving the runtime surface.");
  }

  if (violations.length > 0) {
    console.error("Active visual import-graph SSOT violations:\n");
    for (const violation of violations) console.error(`- ${violation}`);
    process.exit(1);
  }

  console.log(
    `Active visual import graph valid: ${graph.size} reachable source files inspected, including ${visualFiles.length} TSX/CSS visual files governed by the canonical color and typography SSOT.`,
  );
}

main();
