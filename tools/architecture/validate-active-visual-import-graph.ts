#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_ROOT = path.join(ROOT, "src");

const ACTIVE_LAZY_IMPORTS_FILE = "src/app/routes/activeLazyImports.ts";
const ACTIVE_VISUAL_COMPOSITION_FILES = [
  "src/app/routes/sections/AppLayoutRoutes.tsx",
  "src/app/routes/sections/CentralRoutes.tsx",
  "src/app/components/AppLayoutSidebar.tsx",
] as const;

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".css"] as const;
const INDEX_CANDIDATES = ["index.ts", "index.tsx"] as const;

const RAW_RUNTIME_COLOR_RE = /(?:#[0-9a-fA-F]{3,8}\b|\brgba?\s*\()/;
const LEGACY_FONT_RE = /(?:DM Sans|Space Grotesk|Manrope|Bricolage Grotesk)/;
const CSS_FONT_WEIGHT_RE = /font-weight\s*:\s*(\d{3})\b/g;
const ARBITRARY_TAILWIND_WEIGHT_RE = /font-\[(\d{3})\]/g;
const APPROVED_FONT_WEIGHTS = new Set(["400", "500", "600", "700", "800"]);

const SKIPPED_PATH_PARTS = [
  "/__tests__/",
  "/tests/",
  "/src/dev/",
  ".test.",
  ".spec.",
  ".stories.",
] as const;

function toRelative(absolute: string): string {
  return path.relative(ROOT, absolute).split(path.sep).join("/");
}

function normalizeRelative(relative: string): string {
  return relative.split(path.sep).join("/");
}

function shouldSkip(relative: string): boolean {
  const normalized = `/${normalizeRelative(relative)}`;
  return SKIPPED_PATH_PARTS.some((part) => normalized.includes(part));
}

function resolveLocalImport(fromRelative: string, specifier: string): string | null {
  let base: string;

  if (specifier.startsWith("@/")) {
    base = path.join(SRC_ROOT, specifier.slice(2));
  } else if (specifier.startsWith("./") || specifier.startsWith("../")) {
    base = path.resolve(path.dirname(path.join(ROOT, fromRelative)), specifier);
  } else {
    return null;
  }

  const candidates: string[] = [];
  if (path.extname(base)) {
    candidates.push(base);
  } else {
    for (const extension of SOURCE_EXTENSIONS) candidates.push(`${base}${extension}`);
    for (const indexFile of INDEX_CANDIDATES) candidates.push(path.join(base, indexFile));
  }

  const resolved = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  if (!resolved) return null;

  const relative = toRelative(resolved);
  if (!relative.startsWith("src/") || shouldSkip(relative)) return null;
  return relative;
}

function extractLocalImports(relative: string, source: string): string[] {
  const specifiers = new Set<string>();
  const patterns = [
    /(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g,
    /import\(\s*["']([^"']+)["']\s*\)/g,
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1];
      const resolved = resolveLocalImport(relative, specifier);
      if (resolved) specifiers.add(resolved);
    }
  }

  return [...specifiers];
}

function getActiveRoots(violations: string[]): string[] {
  const roots = new Set<string>(ACTIVE_VISUAL_COMPOSITION_FILES);
  const absolute = path.join(ROOT, ACTIVE_LAZY_IMPORTS_FILE);

  if (!fs.existsSync(absolute)) {
    violations.push(`${ACTIVE_LAZY_IMPORTS_FILE}: active runtime import owner is missing.`);
    return [...roots];
  }

  const source = fs.readFileSync(absolute, "utf8");
  const importRe = /import\(\s*["'](@\/[^"']+)["']\s*\)/g;
  for (const match of source.matchAll(importRe)) {
    const resolved = resolveLocalImport(ACTIVE_LAZY_IMPORTS_FILE, match[1]);
    if (!resolved) {
      violations.push(`${ACTIVE_LAZY_IMPORTS_FILE}: active import ${match[1]} could not be resolved.`);
      continue;
    }
    roots.add(resolved);
  }

  return [...roots].filter((relative) => !shouldSkip(relative)).sort();
}

function collectActiveImportGraph(roots: readonly string[], violations: string[]): string[] {
  const visited = new Set<string>();
  const queue = [...roots];

  while (queue.length > 0) {
    const relative = queue.shift();
    if (!relative || visited.has(relative) || shouldSkip(relative)) continue;

    const absolute = path.join(ROOT, relative);
    if (!fs.existsSync(absolute)) {
      violations.push(`${relative}: active import graph file is missing.`);
      continue;
    }

    visited.add(relative);
    if (relative.endsWith(".css")) continue;

    const source = fs.readFileSync(absolute, "utf8");
    for (const dependency of extractLocalImports(relative, source)) {
      if (!visited.has(dependency)) queue.push(dependency);
    }
  }

  return [...visited].sort();
}

function validateVisualFile(relative: string, violations: string[]): void {
  if (!relative.endsWith(".tsx") && !relative.endsWith(".css")) return;
  const content = fs.readFileSync(path.join(ROOT, relative), "utf8");

  if (RAW_RUNTIME_COLOR_RE.test(content)) {
    violations.push(`${relative}: raw runtime color found in active visual import graph; use semantic SSOT tokens.`);
  }
  if (LEGACY_FONT_RE.test(content)) {
    violations.push(`${relative}: legacy font found in active visual import graph.`);
  }

  for (const regex of [CSS_FONT_WEIGHT_RE, ARBITRARY_TAILWIND_WEIGHT_RE]) {
    regex.lastIndex = 0;
    for (const match of content.matchAll(regex)) {
      const weight = match[1];
      if (!APPROVED_FONT_WEIGHTS.has(weight)) {
        violations.push(`${relative}: unsupported font weight ${weight}; loaded weights are 400, 500, 600, 700 and 800.`);
      }
    }
  }
}

function main(): void {
  const violations: string[] = [];
  const roots = getActiveRoots(violations);
  const graph = collectActiveImportGraph(roots, violations);

  for (const relative of graph) validateVisualFile(relative, violations);

  if (violations.length > 0) {
    console.error("Active visual import graph SSOT violations:\n");
    for (const violation of violations) console.error(`- ${violation}`);
    process.exit(1);
  }

  const visualFiles = graph.filter((relative) => relative.endsWith(".tsx") || relative.endsWith(".css"));
  console.log(
    `Active visual import graph SSOT valid: ${roots.length} root(s), ${graph.length} local runtime file(s), ${visualFiles.length} visual file(s) checked transitively.`,
  );
}

main();
