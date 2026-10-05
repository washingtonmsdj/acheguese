#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ENTRYPOINTS = ["src/main.tsx"] as const;
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".css"] as const;
const VISUAL_EXTENSIONS = new Set([".tsx", ".jsx", ".css"]);

const CANONICAL_VISUAL_OWNERS = new Set([
  "src/index.css",
  "src/styles/theme.ts",
  "tailwind.config.ts",
]);

const IGNORED_GRAPH_PATH_PARTS = [
  "/__tests__/",
  "/tests/",
  ".test.",
  ".spec.",
  "/dev/",
] as const;

const LEGACY_FONT_RE = /(?:DM Sans|Space Grotesk|Manrope|Bricolage Grotesk)/;
const RAW_RUNTIME_COLOR_RE = /(?:#[0-9a-fA-F]{3,8}\b|\brgba?\s*\()/;
const DIRECT_TAILWIND_PALETTE_RE =
  /\b(?:text|bg|border|ring|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d+)?\b/;
const DIRECT_FONT_STACK_RE = /\b(?:Arial|Helvetica),?\s*(?:sans-serif)?\b/;

function toPosix(relative: string): string {
  return relative.split(path.sep).join("/");
}

function shouldIgnoreGraphPath(relative: string): boolean {
  const normalized = `/${toPosix(relative)}`;
  return IGNORED_GRAPH_PATH_PARTS.some((part) => normalized.includes(part));
}

function resolveCandidate(base: string): string | null {
  const candidates = [
    base,
    ...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...SOURCE_EXTENSIONS.map((extension) => path.join(base, `index${extension}`)),
  ];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    const stat = fs.statSync(candidate);
    if (!stat.isFile()) continue;
    return candidate;
  }

  return null;
}

function resolveImport(fromFile: string, specifier: string): string | null {
  if (specifier.startsWith("@/")) {
    return resolveCandidate(path.join(ROOT, "src", specifier.slice(2)));
  }

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    return resolveCandidate(path.resolve(path.dirname(fromFile), specifier));
  }

  return null;
}

function extractSpecifiers(source: string): string[] {
  const specifiers = new Set<string>();
  const patterns = [
    /\b(?:import|export)\s+(?:type\s+)?(?:[^;\n]*?\s+from\s+)?["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /@import\s+(?:url\()?\s*["']([^"']+)["']/g,
  ];

  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      if (match[1]) specifiers.add(match[1]);
    }
  }

  return [...specifiers];
}

function collectActiveGraph(): string[] {
  const queue = ENTRYPOINTS.map((entry) => path.join(ROOT, entry));
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current) || !fs.existsSync(current)) continue;

    const relative = toPosix(path.relative(ROOT, current));
    if (shouldIgnoreGraphPath(relative)) continue;

    visited.add(current);

    const extension = path.extname(current);
    if (!SOURCE_EXTENSIONS.includes(extension as (typeof SOURCE_EXTENSIONS)[number])) {
      continue;
    }

    const source = fs.readFileSync(current, "utf8");
    for (const specifier of extractSpecifiers(source)) {
      const resolved = resolveImport(current, specifier);
      if (resolved && !visited.has(resolved)) queue.push(resolved);
    }
  }

  return [...visited].map((absolute) => toPosix(path.relative(ROOT, absolute))).sort();
}

function validateVisualFile(relative: string, violations: string[]): void {
  if (CANONICAL_VISUAL_OWNERS.has(relative)) return;

  const absolute = path.join(ROOT, relative);
  const source = fs.readFileSync(absolute, "utf8");

  if (RAW_RUNTIME_COLOR_RE.test(source)) {
    violations.push(
      `${relative}: raw HEX/RGB color in active frontend runtime; consume semantic CSS/Tailwind tokens from the visual SSOT.`,
    );
  }

  if (DIRECT_TAILWIND_PALETTE_RE.test(source)) {
    violations.push(
      `${relative}: direct Tailwind palette color in active frontend runtime; consume territory/business/status semantic tokens.`,
    );
  }

  if (LEGACY_FONT_RE.test(source)) {
    violations.push(
      `${relative}: legacy font family in active frontend runtime; consume the canonical Plus Jakarta Sans token.`,
    );
  }

  if (DIRECT_FONT_STACK_RE.test(source)) {
    violations.push(
      `${relative}: direct Arial/Helvetica font stack in active frontend runtime; consume --font-sans instead.`,
    );
  }
}

function main(): void {
  const graph = collectActiveGraph();
  const visualFiles = graph.filter((relative) =>
    VISUAL_EXTENSIONS.has(path.extname(relative)),
  );
  const violations: string[] = [];

  for (const relative of visualFiles) {
    validateVisualFile(relative, violations);
  }

  if (violations.length > 0) {
    console.error("Active frontend visual SSOT violations:\n");
    for (const violation of violations) console.error(`- ${violation}`);
    console.error(
      `\nScanned ${visualFiles.length} visual file(s) reachable from ${ENTRYPOINTS.join(", ")}.`,
    );
    process.exit(1);
  }

  console.log(
    `Active frontend visual SSOT valid: ${visualFiles.length} visual file(s) reachable from ${ENTRYPOINTS.join(", ")} contain no raw runtime colors, direct Tailwind palettes, or legacy/direct font stacks outside canonical owners.`,
  );
}

main();
