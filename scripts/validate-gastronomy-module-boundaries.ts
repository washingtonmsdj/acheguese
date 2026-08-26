#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const GASTRONOMY_ROOT = "src/modules/business/gastronomy";

// Transitional runtime debt only. This set must shrink monotonically as
// infrastructure ownership moves to src/core/business (or another canonical core owner).
const ALLOWED_DIRECT_RUNTIME_INTEGRATION_FILES = new Set([
  "src/modules/business/gastronomy/niches/pizzaria/PizzaAdminService.ts",
  "src/modules/business/gastronomy/niches/versioning/NicheVersioningService.ts",
  "src/modules/business/gastronomy/services/DeliveryAreaService.ts",
  "src/modules/business/gastronomy/services/GastronomyProfileService.ts",
  "src/modules/business/gastronomy/services/MenuService.ts",
  "src/modules/business/gastronomy/services/activity.queries.ts",
  "src/modules/business/gastronomy/services/favorites.queries.ts",
  "src/modules/business/gastronomy/services/gastronomy-runtime.queries.ts",
  "src/modules/business/gastronomy/services/menu.queries.ts",
  "src/modules/business/gastronomy/services/review.queries.ts",
]);

const REQUIRED_CORE_BRIDGES = new Map([
  [
    "src/modules/business/gastronomy/services/gastronomy.queries.ts",
    "@/core/business/services/gastronomy.queries",
  ],
]);

const CODE_FILE_RE = /\.(ts|tsx|js|jsx)$/;
const TYPE_ONLY_IMPORT_RE = /import\s+type\s+[\s\S]*?from\s+["'][^"']+["'];?/g;
const DIRECT_INTEGRATION_RE =
  /(?:from\s+["']@\/integrations\/|import\(\s*["']@\/integrations\/)/;
const DIRECT_SUPABASE_PACKAGE_RE =
  /(?:from\s+["']@supabase\/supabase-js["']|import\(\s*["']@supabase\/supabase-js["']\s*\))/;

function normalize(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function isRuntimeCodeFile(filePath: string): boolean {
  const normalized = normalize(filePath);
  return (
    CODE_FILE_RE.test(normalized) &&
    !normalized.includes("/__tests__/") &&
    !normalized.includes(".test.") &&
    !normalized.includes(".spec.")
  );
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile() && isRuntimeCodeFile(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

function withoutTypeOnlyImports(content: string): string {
  return content.replace(TYPE_ONLY_IMPORT_RE, "");
}

function main(): void {
  const fullRoot = path.join(ROOT, GASTRONOMY_ROOT);
  if (!fs.existsSync(fullRoot)) {
    console.error(`Gastronomy module root missing: ${GASTRONOMY_ROOT}`);
    process.exit(1);
  }

  const violations: string[] = [];
  const actualDirectRuntimeIntegrationFiles = new Set<string>();

  for (const filePath of walk(fullRoot)) {
    const relative = normalize(path.relative(ROOT, filePath));
    const content = fs.readFileSync(filePath, "utf8");
    const runtimeContent = withoutTypeOnlyImports(content);

    if (DIRECT_SUPABASE_PACKAGE_RE.test(runtimeContent)) {
      violations.push(
        `${relative}: direct runtime @supabase/supabase-js import is forbidden in the Gastronomy module.`,
      );
    }

    if (DIRECT_INTEGRATION_RE.test(runtimeContent)) {
      actualDirectRuntimeIntegrationFiles.add(relative);
      if (!ALLOWED_DIRECT_RUNTIME_INTEGRATION_FILES.has(relative)) {
        violations.push(
          `${relative}: new direct runtime integrations access is forbidden. Move persistence/integration ownership to core.`,
        );
      }
    }
  }

  for (const legacyFile of ALLOWED_DIRECT_RUNTIME_INTEGRATION_FILES) {
    if (!actualDirectRuntimeIntegrationFiles.has(legacyFile)) {
      violations.push(
        `${legacyFile}: transitional allowlist entry is stale. Remove it from ALLOWED_DIRECT_RUNTIME_INTEGRATION_FILES in the same migration commit.`,
      );
    }
  }

  for (const [bridgeFile, canonicalImport] of REQUIRED_CORE_BRIDGES) {
    const absolute = path.join(ROOT, bridgeFile);
    if (!fs.existsSync(absolute)) {
      violations.push(`${bridgeFile}: required compatibility bridge is missing.`);
      continue;
    }

    const content = fs.readFileSync(absolute, "utf8");
    if (!content.includes(canonicalImport)) {
      violations.push(
        `${bridgeFile}: compatibility bridge must point one-way to ${canonicalImport}.`,
      );
    }
  }

  if (violations.length > 0) {
    console.error("Gastronomy module boundary violations:\n");
    for (const violation of violations) console.error(`- ${violation}`);
    process.exit(1);
  }

  console.log(
    `Gastronomy module boundary valid: ${actualDirectRuntimeIntegrationFiles.size} known runtime integration files frozen for migration; type-only integration imports are not counted as runtime debt.`,
  );
}

main();
