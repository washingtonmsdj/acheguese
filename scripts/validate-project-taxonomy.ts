#!/usr/bin/env tsx

import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const CANONICAL_MODULES = [
  "admin",
  "ai",
  "business",
  "central",
  "classifieds",
  "community-alerts",
  "community-events",
  "community-feed",
  "community-groups",
  "community-issues",
  "community-lost-found",
  "community-recommendations",
  "communication-territorial",
  "guide",
  "mobility",
  "professionals",
  "profile",
  "work-opportunities",
] as const;

const DEPRECATED_COMPAT_MODULE_ROOTS = [
  "community",
] as const;

const LEGACY_FORBIDDEN_MODULE_ROOTS = [
  "admin-identidade",
  "admin-motoristas",
  "analytics",
  "dashboard",
  "delivery",
  "empresa",
  "empresas-landing",
  "gastronomy",
  "jobs",
  "notifications",
  "onboarding",
  "promotions",
  "services",
  "vagas",
  "verification",
] as const;

const LEGACY_FORBIDDEN_CORE_ROOTS = [
  "admin-identidade",
  "admin-motoristas",
  "civic",
  "events",
  "gastronomy",
  "lostfound",
  "supabase",
  "promotions",
  "services",
  "tourist-points",
  "vagas",
] as const;

const REQUIRED_NESTED_PATHS = [
  "src/modules/business/company",
  "src/modules/business/gastronomy",
  "src/modules/business/promotions",
  "src/modules/community-alerts",
  "src/modules/community-events",
  "src/modules/community-feed",
  "src/modules/community-groups",
  "src/modules/community-issues",
  "src/modules/community-lost-found",
  "src/modules/community-recommendations",
  "src/modules/mobility/delivery",
  "src/modules/classifieds/jobs",
  "src/modules/professionals/services",
  "src/app/features/landing",
  "src/app/features/business-landing",
  "src/app/features/onboarding",
] as const;

const FORBIDDEN_LEGACY_PATH_LITERALS = [
  "src/modules/admin-identidade",
  "src/modules/admin-motoristas",
  "src/modules/analytics",
  "src/modules/dashboard",
  "src/modules/delivery",
  "src/modules/empresa",
  "src/modules/empresas-landing",
  "src/modules/gastronomy",
  "src/modules/jobs",
  "src/modules/landing",
  "src/modules/notifications",
  "src/modules/onboarding",
  "src/modules/promotions",
  "src/modules/services",
  "src/modules/vagas",
  "src/modules/verification",
] as const;

const LEGACY_SCAN_IGNORE_FILES = new Set([
  "scripts/validate-project-taxonomy.ts",
  "scripts/fix-architecture-violations.ts",
  "scripts/fix-remaining-violations.ts",
]);

function pathExists(relativePath: string): boolean {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function listDirectories(relativeDir: string): string[] {
  const full = path.join(ROOT, relativeDir);
  if (!fs.existsSync(full)) {
    return [];
  }
  return fs
    .readdirSync(full, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function toSet(values: readonly string[]): Set<string> {
  return new Set(values);
}

function walkFiles(relativeDir: string): string[] {
  const fullDir = path.join(ROOT, relativeDir);
  if (!fs.existsSync(fullDir)) {
    return [];
  }

  const collected: string[] = [];
  const stack = [fullDir];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      collected.push(fullPath);
    }
  }

  return collected;
}

function normalize(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function main() {
  const violations: string[] = [];

  const moduleRoots = listDirectories("src/modules");
  const moduleRootSet = toSet(moduleRoots);
  const canonicalModuleSet = toSet(CANONICAL_MODULES);
  const deprecatedCompatModuleSet = toSet(DEPRECATED_COMPAT_MODULE_ROOTS);

  for (const root of moduleRoots) {
    if (!canonicalModuleSet.has(root) && !deprecatedCompatModuleSet.has(root)) {
      violations.push(
        `Modulo de topo fora do SSOT em src/modules: "${root}". Permitidos: ${CANONICAL_MODULES.join(", ")}`,
      );
    }
  }

  for (const required of CANONICAL_MODULES) {
    if (!moduleRootSet.has(required)) {
      violations.push(`Modulo canonico ausente em src/modules: "${required}"`);
    }
  }

  for (const legacyRoot of LEGACY_FORBIDDEN_MODULE_ROOTS) {
    if (moduleRootSet.has(legacyRoot)) {
      violations.push(
        `Alias/pasta legada proibida ainda presente em src/modules: "${legacyRoot}"`,
      );
    }
  }

  const coreRoots = listDirectories("src/core");
  const coreRootSet = toSet(coreRoots);
  for (const legacyCoreRoot of LEGACY_FORBIDDEN_CORE_ROOTS) {
    if (coreRootSet.has(legacyCoreRoot)) {
      violations.push(
        `Pasta legada proibida ainda presente em src/core: "${legacyCoreRoot}"`,
      );
    }
  }

  for (const requiredPath of REQUIRED_NESTED_PATHS) {
    if (!pathExists(requiredPath)) {
      violations.push(`Path obrigatorio ausente para taxonomia oficial: ${requiredPath}`);
    }
  }

  const scannedSourceFiles = [...walkFiles("src"), ...walkFiles("scripts")].filter((filePath) => {
    const normalized = normalize(filePath);
    return (
      normalized.endsWith(".ts") ||
      normalized.endsWith(".tsx") ||
      normalized.endsWith(".js") ||
      normalized.endsWith(".jsx")
    );
  });

  for (const filePath of scannedSourceFiles) {
    const relative = normalize(path.relative(ROOT, filePath));
    if (LEGACY_SCAN_IGNORE_FILES.has(relative)) {
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");
    for (const legacyPath of FORBIDDEN_LEGACY_PATH_LITERALS) {
      if (content.includes(legacyPath)) {
        violations.push(
          `Referencia legada detectada em ${relative}: "${legacyPath}"`,
        );
      }
    }
  }

  if (violations.length > 0) {
    console.error("Taxonomia estrutural invalida:\n");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  console.log("Taxonomia estrutural valida.");
}

main();
