import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SRC_ROOT = path.join(ROOT, "src");

const ACTIVE_FRONTEND_ROOTS = [
  "src/app/routes/AppRoutes.tsx",
  "src/app/routes/activeLazyImports.ts",
] as const;

const SOURCE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js", ".css"] as const;
const VISUAL_EXTENSIONS = new Set([".tsx", ".jsx", ".css"]);
const RAW_RUNTIME_COLOR_RE = /(?:#[0-9a-fA-F]{3,8}\b|\brgba?\s*\()/;
const LEGACY_FONT_RE = /(?:DM Sans|Space Grotesk|Manrope|Bricolage Grotesque)/;
const DYNAMIC_IMPORT_RE = /\bimport\(\s*["']([^"']+)["']\s*\)/g;
const CSS_IMPORT_RE = /@import\s+(?:url\()?\s*["']([^"']+)["']/g;

function normalizeRelative(absolute: string): string {
  return path.relative(ROOT, absolute).split(path.sep).join("/");
}

function stripImportDecorators(specifier: string): string {
  return specifier.split(/[?#]/, 1)[0];
}

function resolveInternalImport(fromRelative: string, rawSpecifier: string): string | null {
  const specifier = stripImportDecorators(rawSpecifier);
  if (!specifier.startsWith("@/") && !specifier.startsWith(".")) return null;

  const importer = path.join(ROOT, fromRelative);
  const base = specifier.startsWith("@/")
    ? path.join(SRC_ROOT, specifier.slice(2))
    : path.resolve(path.dirname(importer), specifier);

  if (!base.startsWith(SRC_ROOT + path.sep) && base !== SRC_ROOT) return null;

  const explicitExtension = path.extname(base);
  if (explicitExtension && !SOURCE_EXTENSIONS.includes(explicitExtension as (typeof SOURCE_EXTENSIONS)[number])) {
    return null;
  }

  const candidates = explicitExtension
    ? [base]
    : [
        ...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`),
        ...SOURCE_EXTENSIONS.map((extension) => path.join(base, `index${extension}`)),
      ];

  const resolved = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  return resolved ? normalizeRelative(resolved) : null;
}

function importedSpecifiers(relative: string, content: string): string[] {
  const extension = path.extname(relative);
  const imports = new Set<string>();

  if (extension === ".css") {
    CSS_IMPORT_RE.lastIndex = 0;
    for (const match of content.matchAll(CSS_IMPORT_RE)) imports.add(match[1]);
    return [...imports];
  }

  const preprocessed = ts.preProcessFile(content, true, true);
  for (const imported of preprocessed.importedFiles) imports.add(imported.fileName);

  DYNAMIC_IMPORT_RE.lastIndex = 0;
  for (const match of content.matchAll(DYNAMIC_IMPORT_RE)) imports.add(match[1]);

  return [...imports];
}

function collectActiveFrontendGraph(): { files: string[]; unresolved: string[] } {
  const queue = [...ACTIVE_FRONTEND_ROOTS];
  const visited = new Set<string>();
  const unresolved: string[] = [];

  while (queue.length > 0) {
    const relative = queue.shift()!;
    if (visited.has(relative)) continue;

    const absolute = path.join(ROOT, relative);
    if (!fs.existsSync(absolute)) {
      unresolved.push(`${relative} (active root missing)`);
      continue;
    }

    visited.add(relative);
    const content = fs.readFileSync(absolute, "utf8");

    for (const specifier of importedSpecifiers(relative, content)) {
      if (!specifier.startsWith("@/") && !specifier.startsWith(".")) continue;
      const resolved = resolveInternalImport(relative, specifier);
      if (resolved) {
        if (!visited.has(resolved)) queue.push(resolved);
        continue;
      }

      const undecorated = stripImportDecorators(specifier);
      const explicitExtension = path.extname(undecorated);
      if (!explicitExtension || SOURCE_EXTENSIONS.includes(explicitExtension as (typeof SOURCE_EXTENSIONS)[number])) {
        unresolved.push(`${relative} -> ${specifier}`);
      }
    }
  }

  return { files: [...visited].sort(), unresolved: unresolved.sort() };
}

describe("active frontend visual SSOT import graph", () => {
  const graph = collectActiveFrontendGraph();

  it("resolves every internal source import reachable from active frontend roots", () => {
    expect(graph.unresolved).toEqual([]);
  });

  it("keeps every reachable visual source free of raw runtime colors and legacy fonts", () => {
    const violations: string[] = [];

    for (const relative of graph.files) {
      if (!VISUAL_EXTENSIONS.has(path.extname(relative))) continue;
      const content = fs.readFileSync(path.join(ROOT, relative), "utf8");
      if (RAW_RUNTIME_COLOR_RE.test(content)) violations.push(`${relative}: raw runtime color`);
      if (LEGACY_FONT_RE.test(content)) violations.push(`${relative}: legacy font`);
    }

    expect(violations).toEqual([]);
  });

  it("covers the active horizontal surfaces and their internal components", () => {
    expect(graph.files).toContain("src/app/pages/NotificationsPage.tsx");
    expect(graph.files).toContain("src/app/pages/MessagingInboxPage.tsx");
    expect(graph.files).toContain("src/modules/messaging/pages/MensagensPage.tsx");
    expect(graph.files).toContain("src/modules/messaging/pages/MensagensPage.css");
  });
});
