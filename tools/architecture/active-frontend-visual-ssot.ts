import fs from "node:fs";
import path from "node:path";

const ACTIVE_FRONTEND_ENTRY = "src/App.tsx";

const LOCAL_SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".css"] as const;
const VISUAL_SOURCE_EXTENSIONS = new Set([".tsx", ".css"]);

/**
 * Internal/admin and development-only surfaces are not part of the launch
 * frontend composition. These exclusions describe product boundaries, not
 * visual-debt allowlists.
 */
const ACTIVE_GRAPH_EXCLUDED_PREFIXES = [
  "src/app/routes/sections/AdminRoutes",
  "src/core/admin/",
  "src/modules/admin/",
  "src/dev/",
] as const;

const ACTIVE_GRAPH_EXCLUDED_FILES = new Set([
  // Internal, admin-gated national showcase. It is noindex and not an MVP
  // public surface even though the route remains mounted for authorized use.
  "src/core/routing/components/BrasilShowcasePage.tsx",
]);

/** Owners may declare the primitives that consumers are forbidden to copy. */
const VISUAL_SSOT_OWNER_FILES = new Set([
  "src/index.css",
  "src/styles/accessibility-core.css",
  "src/styles/accessibility.css",
]);

/**
 * Third-party marks must preserve their official brand artwork. Keep this list
 * exact and asset-specific; it must never become a generic visual allowlist.
 */
const EXTERNAL_BRAND_ASSET_FILES = new Set([
  "src/shared/components/branding/google-provider-mark.css",
]);

const STATIC_IMPORT_EXPORT_RE =
  /\b(?:import|export)\s+(?:type\s+)?(?:[^"'`;]*?\s+from\s+)?["']([^"']+)["']/g;
const DYNAMIC_IMPORT_RE = /\bimport\(\s*["']([^"']+)["']\s*\)/g;
const CSS_IMPORT_RE = /@import\s+(?:url\(\s*)?["']([^"']+)["']/g;

const RAW_RUNTIME_COLOR_RE =
  /(?:#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(\s*\d)/;
const NON_SEMANTIC_PALETTE_COLOR_RE =
  /\b(?:text|bg|border|ring|shadow|from|via|to)-(?:orange|emerald|green|lime|rose|red|pink|sky|cyan|violet|purple|amber|yellow|teal|blue|indigo|fuchsia)-\d{2,3}(?:\/\d+)?\b/;
const LEGACY_FONT_RE = /(?:DM Sans|Space Grotesk|Manrope|Bricolage Grotesk)/;

function normalizeRelativePath(absolutePath: string, root: string): string {
  return path.relative(root, absolutePath).split(path.sep).join("/");
}

function isExcludedFromActiveGraph(relativePath: string): boolean {
  if (ACTIVE_GRAPH_EXCLUDED_FILES.has(relativePath)) return true;

  return ACTIVE_GRAPH_EXCLUDED_PREFIXES.some((prefix) => {
    if (prefix.endsWith("/")) return relativePath.startsWith(prefix);
    return (
      relativePath === prefix ||
      relativePath.startsWith(`${prefix}.`) ||
      relativePath.startsWith(`${prefix}/`)
    );
  });
}

function isIgnoredSourceFile(relativePath: string): boolean {
  return (
    relativePath.includes("/__tests__/") ||
    /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(relativePath) ||
    relativePath.endsWith(".d.ts")
  );
}

function resolveLocalImport(
  root: string,
  importerRelativePath: string,
  rawSpecifier: string,
): string | null {
  const specifier = rawSpecifier.replace(/[?#].*$/, "");
  let baseAbsolute: string;

  if (specifier.startsWith("@/")) {
    baseAbsolute = path.join(root, "src", specifier.slice(2));
  } else if (specifier.startsWith(".")) {
    baseAbsolute = path.resolve(root, path.dirname(importerRelativePath), specifier);
  } else {
    return null;
  }

  const candidates: string[] = [];
  if (path.extname(baseAbsolute)) {
    candidates.push(baseAbsolute);
  } else {
    for (const extension of LOCAL_SOURCE_EXTENSIONS) candidates.push(`${baseAbsolute}${extension}`);
    for (const extension of LOCAL_SOURCE_EXTENSIONS) candidates.push(path.join(baseAbsolute, `index${extension}`));
  }

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) continue;

    const relative = normalizeRelativePath(candidate, root);
    if (!relative.startsWith("src/") || isIgnoredSourceFile(relative) || isExcludedFromActiveGraph(relative)) return null;
    return relative;
  }

  return null;
}

function collectImportSpecifiers(content: string, extension: string): string[] {
  const specifiers = new Set<string>();

  for (const regex of [STATIC_IMPORT_EXPORT_RE, DYNAMIC_IMPORT_RE]) {
    regex.lastIndex = 0;
    for (const match of content.matchAll(regex)) if (match[1]) specifiers.add(match[1]);
  }

  if (extension === ".css") {
    CSS_IMPORT_RE.lastIndex = 0;
    for (const match of content.matchAll(CSS_IMPORT_RE)) if (match[1]) specifiers.add(match[1]);
  }

  return [...specifiers];
}

export function collectActiveFrontendSourceFiles(root: string): string[] {
  const pending = [ACTIVE_FRONTEND_ENTRY];
  const visited = new Set<string>();

  while (pending.length > 0) {
    const relative = pending.pop();
    if (!relative || visited.has(relative)) continue;
    if (isExcludedFromActiveGraph(relative) || isIgnoredSourceFile(relative)) continue;

    const absolute = path.join(root, relative);
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) continue;

    visited.add(relative);

    const extension = path.extname(relative);
    if (!LOCAL_SOURCE_EXTENSIONS.includes(extension as (typeof LOCAL_SOURCE_EXTENSIONS)[number])) continue;

    const content = fs.readFileSync(absolute, "utf8");
    for (const specifier of collectImportSpecifiers(content, extension)) {
      const resolved = resolveLocalImport(root, relative, specifier);
      if (resolved && !visited.has(resolved)) pending.push(resolved);
    }
  }

  return [...visited].sort();
}

function lineNumberAt(content: string, index: number): number {
  return content.slice(0, index).split("\n").length;
}

function pushFirstViolation(
  violations: string[],
  relative: string,
  content: string,
  pattern: RegExp,
  message: string,
): void {
  pattern.lastIndex = 0;
  const match = pattern.exec(content);
  if (!match || match.index === undefined) return;
  violations.push(`${relative}:${lineNumberAt(content, match.index)}: ${message} (${JSON.stringify(match[0])}).`);
}

export function collectActiveFrontendVisualSsotViolations(root: string): string[] {
  const violations: string[] = [];
  const activeFiles = collectActiveFrontendSourceFiles(root);

  if (activeFiles.length === 0) {
    return [`${ACTIVE_FRONTEND_ENTRY}: active frontend import graph resolved to zero files.`];
  }

  for (const relative of activeFiles) {
    const extension = path.extname(relative);
    if (!VISUAL_SOURCE_EXTENSIONS.has(extension)) continue;
    if (VISUAL_SSOT_OWNER_FILES.has(relative) || EXTERNAL_BRAND_ASSET_FILES.has(relative)) continue;

    const content = fs.readFileSync(path.join(root, relative), "utf8");

    pushFirstViolation(violations, relative, content, RAW_RUNTIME_COLOR_RE, "raw runtime color found in active frontend; consume semantic CSS/Tailwind tokens from the visual SSOT");
    pushFirstViolation(violations, relative, content, NON_SEMANTIC_PALETTE_COLOR_RE, "direct Tailwind palette color found in active frontend; consume semantic territory/status/category tokens");
    pushFirstViolation(violations, relative, content, LEGACY_FONT_RE, "legacy font found in active frontend; consume the canonical Plus Jakarta Sans token");
  }

  return violations;
}
