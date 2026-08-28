#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const GASTRONOMY_ROOT = "src/modules/business/gastronomy";

// Gastronomy runtime integration debt is expected to stay at zero.
const ALLOWED_DIRECT_RUNTIME_INTEGRATION_FILES = new Set<string>();

// Pure legacy -> core compatibility bridges. These files must stay bridge-only.
const REQUIRED_CORE_BRIDGES = new Map([
  ["src/modules/business/gastronomy/services/gastronomy-runtime.queries.ts", "@/core/business/services/gastronomy-runtime.queries"],
  ["src/modules/business/gastronomy/services/GastronomyProfileService.ts", "@/core/business/services/GastronomyProfileService"],
  ["src/modules/business/gastronomy/services/MenuService.ts", "@/core/business/services/MenuService"],
  ["src/modules/business/gastronomy/niches/types.ts", "@/core/business/niches/types"],
  ["src/modules/business/gastronomy/niches/pizzaria/PizzaAdminService.ts", "@/core/business/niches/pizzaria/PizzaAdminService"],
]);

// The compatibility files above may still exist while central manifests catch up,
// but product/runtime code must not create new callers of their legacy module paths.
const FORBIDDEN_COMPATIBILITY_IMPORTS = new Map([
  ["@/modules/business/gastronomy/services/gastronomy-runtime.queries", "@/core/business/services/gastronomy-runtime.queries"],
  ["@/modules/business/gastronomy/services/GastronomyProfileService", "@/core/business/services/GastronomyProfileService"],
  ["@/modules/business/gastronomy/services/MenuService", "@/core/business/services/MenuService"],
  ["@/modules/business/gastronomy/niches/types", "@/core/business/niches/types"],
  ["@/modules/business/gastronomy/niches/pizzaria/PizzaAdminService", "@/core/business/niches/pizzaria/PizzaAdminService"],
]);

// These are NOT bridges. They intentionally combine canonical core contracts
// with module-owned UI/cart/taxonomy contracts and therefore remain legitimate
// module surfaces during G2.
const MODULE_LOCAL_CONTRACT_SURFACES = new Map([
  ["src/modules/business/gastronomy/types/gastronomy/index.ts", "@/core/business/types/gastronomy"],
  ["src/modules/business/gastronomy/types/menu.ts", "@/core/business/types/gastronomyMenu"],
  ["src/modules/business/gastronomy/niches/pizzaria/types.ts", "@/core/business/niches/pizzaria/types"],
]);

const RETIRED_CORE_BRIDGES = new Set([
  "src/modules/business/gastronomy/services/gastronomy.queries.ts",
  "src/modules/business/gastronomy/services/resolveGastronomyBusinessId.ts",
  "src/modules/business/gastronomy/services/activity.queries.ts",
  "src/modules/business/gastronomy/services/favorites.queries.ts",
  "src/modules/business/gastronomy/services/review.queries.ts",
  "src/modules/business/gastronomy/services/menu.queries.ts",
  "src/modules/business/gastronomy/services/DeliveryAreaService.ts",
  "src/modules/business/gastronomy/niches/versioning/types.ts",
  "src/modules/business/gastronomy/niches/versioning/NicheVersioningService.ts",
]);

const CODE_FILE_RE = /\.(ts|tsx|js|jsx)$/;
const TYPE_ONLY_IMPORT_RE = /import\s+type\s+[\s\S]*?from\s+["'][^"']+["'];?/g;
const DIRECT_INTEGRATION_RE = /(?:from\s+["']@\/integrations\/|import\(\s*["']@\/integrations\/)/;
const DIRECT_SUPABASE_PACKAGE_RE = /(?:from\s+["']@supabase\/supabase-js["']|import\(\s*["']@supabase\/supabase-js["']\s*\))/;

function normalize(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function isRuntimeCodeFile(filePath: string): boolean {
  const normalized = normalize(filePath);
  return CODE_FILE_RE.test(normalized)
    && !normalized.includes("/__tests__/")
    && !normalized.includes(".test.")
    && !normalized.includes(".spec.");
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.isFile() && isRuntimeCodeFile(fullPath)) files.push(fullPath);
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

    for (const [legacyImport, canonicalImport] of FORBIDDEN_COMPATIBILITY_IMPORTS) {
      if (content.includes(legacyImport)) {
        violations.push(`${relative}: compatibility import ${legacyImport} is forbidden for product/runtime callers. Import ${canonicalImport} directly.`);
      }
    }

    if (DIRECT_SUPABASE_PACKAGE_RE.test(runtimeContent)) {
      violations.push(`${relative}: direct runtime @supabase/supabase-js import is forbidden in the Gastronomy module.`);
    }
    if (DIRECT_INTEGRATION_RE.test(runtimeContent)) {
      actualDirectRuntimeIntegrationFiles.add(relative);
      if (!ALLOWED_DIRECT_RUNTIME_INTEGRATION_FILES.has(relative)) {
        violations.push(`${relative}: new direct runtime integrations access is forbidden. Move persistence/integration ownership to core.`);
      }
    }
  }

  for (const legacyFile of ALLOWED_DIRECT_RUNTIME_INTEGRATION_FILES) {
    if (!actualDirectRuntimeIntegrationFiles.has(legacyFile)) {
      violations.push(`${legacyFile}: transitional allowlist entry is stale. Remove it from ALLOWED_DIRECT_RUNTIME_INTEGRATION_FILES in the same migration commit.`);
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
      violations.push(`${bridgeFile}: compatibility bridge must point one-way to ${canonicalImport}.`);
    }
  }

  for (const [surfaceFile, canonicalImport] of MODULE_LOCAL_CONTRACT_SURFACES) {
    const absolute = path.join(ROOT, surfaceFile);
    if (!fs.existsSync(absolute)) {
      violations.push(`${surfaceFile}: required module-local contract surface is missing.`);
      continue;
    }
    const content = fs.readFileSync(absolute, "utf8");
    if (!content.includes(canonicalImport)) {
      violations.push(`${surfaceFile}: module contract surface must reuse canonical contracts from ${canonicalImport}.`);
    }
  }

  for (const retiredBridge of RETIRED_CORE_BRIDGES) {
    if (fs.existsSync(path.join(ROOT, retiredBridge))) {
      violations.push(`${retiredBridge}: retired compatibility bridge was recreated.`);
    }
  }

  if (violations.length > 0) {
    console.error("Gastronomy module boundary violations:\n");
    for (const violation of violations) console.error(`- ${violation}`);
    process.exit(1);
  }

  console.log(`Gastronomy module boundary valid: ${actualDirectRuntimeIntegrationFiles.size} runtime integration files; ${REQUIRED_CORE_BRIDGES.size} pure bridges enforced; ${FORBIDDEN_COMPATIBILITY_IMPORTS.size} legacy caller imports forbidden; ${MODULE_LOCAL_CONTRACT_SURFACES.size} module contract surfaces preserved; retired bridges absent; type-only integration imports are not counted as runtime debt.`);
}

main();