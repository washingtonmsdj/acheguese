#!/usr/bin/env tsx

import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const TRANSVERSAL_MODULES = [
  "community-feed",
  "community-issues",
  "community-groups",
  "community-events",
  "community-recommendations",
  "community-lost-found",
] as const;

const CORE_DOMAIN_PATHS = [
  "src/core/community-feed",
  "src/core/community/alerts",
  "src/core/community-issues",
  "src/core/community-groups",
  "src/core/community-recommendations",
  "src/core/community-lost-found",
  "src/core/nearby",
] as const;

const CODE_FILE_RE = /\.(ts|tsx|js|jsx)$/;
const MODULE_IMPORT_RE = /from\s+["']@\/modules\/([^/"']+)/g;
const DYNAMIC_MODULE_IMPORT_RE = /import\(\s*["']@\/modules\/([^/"']+)/g;
const DIRECT_DB_RE =
  /(\bsupabase\s*\.\s*(from|rpc|channel|functions|auth|storage|removeChannel)\s*\(|from\s+["']@\/integrations\/supabase(?:\/client)?["'])/;
const DEPRECATED_COMMUNITY_IMPORT_RE =
  /(?:from\s+["']|import\(\s*["'])@\/modules\/community(?:\/|["'])/;
const CORE_COMMUNITY_BARREL_IMPORT_RE =
  /(?:from\s+["']|import\(\s*["'])@\/core\/community["']/;
const CORE_COMMUNITY_LEGACY_IMPORT_RE =
  /(?:from\s+["']|import\(\s*["'])@\/core\/community\//;
const CANONICAL_COMMUNITY_LAUNCH_IMPORT_RE =
  /(?:from\s+["']|import\(\s*["'])@\/core\/community\/config\/communityLaunch["']/;

function normalize(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    if (entry.isFile() && CODE_FILE_RE.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function hasDisallowedCoreCommunityImport(content: string): boolean {
  if (!CORE_COMMUNITY_LEGACY_IMPORT_RE.test(content)) return false;

  const withoutCanonicalLaunchContract = content.replace(
    /(?:from\s+["']|import\(\s*["'])@\/core\/community\/config\/communityLaunch["']/g,
    "",
  );

  return CORE_COMMUNITY_LEGACY_IMPORT_RE.test(withoutCanonicalLaunchContract);
}

function validateModuleCompatibleRoot(
  relativeRoot: string,
  violations: string[],
): void {
  const fullRoot = path.join(ROOT, relativeRoot);
  if (!fs.existsSync(fullRoot)) return;

  for (const filePath of walk(fullRoot)) {
    const relative = normalize(path.relative(ROOT, filePath));
    const content = fs.readFileSync(filePath, "utf8");

    for (const match of content.matchAll(MODULE_IMPORT_RE)) {
      violations.push(
        `${relative}: modulo transversal nao pode importar outro modulo (${match[1]}). Use core/*.`,
      );
    }

    for (const match of content.matchAll(DYNAMIC_MODULE_IMPORT_RE)) {
      violations.push(
        `${relative}: modulo transversal nao pode importar dinamicamente outro modulo (${match[1]}). Use core/*.`,
      );
    }

    if (DIRECT_DB_RE.test(content)) {
      violations.push(
        `${relative}: modulo transversal nao pode acessar Supabase direto. Use service/repository em core.`,
      );
    }

    if (hasDisallowedCoreCommunityImport(content)) {
      violations.push(
        `${relative}: modulo transversal nao deve importar @/core/community/*. Use core/community-* ou outro owner canonico.`,
      );
    }
  }
}

function main() {
  const violations: string[] = [];

  for (const corePath of CORE_DOMAIN_PATHS) {
    const fullPath = path.join(ROOT, corePath);
    if (!fs.existsSync(fullPath)) {
      violations.push(`Core transversal ausente: ${corePath}`);
    }
  }

  for (const moduleName of TRANSVERSAL_MODULES) {
    const moduleRoot = `src/modules/${moduleName}`;
    if (!fs.existsSync(path.join(ROOT, moduleRoot))) {
      violations.push(`Modulo transversal ausente: ${moduleRoot}`);
      continue;
    }

    validateModuleCompatibleRoot(moduleRoot, violations);
  }

  const scanRoots = ["src/app", "src/core", "src/shared", "tests"];
  for (const scanRoot of scanRoots) {
    for (const filePath of walk(path.join(ROOT, scanRoot))) {
      const relative = normalize(path.relative(ROOT, filePath));
      const content = fs.readFileSync(filePath, "utf8");

      if (DEPRECATED_COMMUNITY_IMPORT_RE.test(content)) {
        violations.push(
          `${relative}: import do agregador legado @/modules/community proibido. Use community-feed/community-alerts/etc ou core/*.`,
        );
      }

      if (CORE_COMMUNITY_BARREL_IMPORT_RE.test(content)) {
        violations.push(
          `${relative}: import do barrel @/core/community proibido. Use subdominio explicito em core/* ou modulo transversal.`,
        );
      }
    }
  }

  const externalRoots = [
    "src/app",
    "src/shared",
    "src/modules/business",
    "src/modules/classifieds",
    "src/modules/mobility",
    "src/modules/professionals",
    "src/modules/profile",
    "tests",
  ];
  for (const scanRoot of externalRoots) {
    for (const filePath of walk(path.join(ROOT, scanRoot))) {
      const relative = normalize(path.relative(ROOT, filePath));
      const content = fs.readFileSync(filePath, "utf8");

      if (hasDisallowedCoreCommunityImport(content)) {
        violations.push(
          `${relative}: import direto de @/core/community/* proibido fora dos dominios de compatibilidade. Use core/community-*, core/social, core/posts, core/profiles ou core/routing.`,
        );
      }
    }
  }

  if (violations.length > 0) {
    console.error("Community transversal boundary violations:\n");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  console.log("Community transversal boundaries valid; the documented community launch config remains the only cross-domain core/community contract.");
}

main();
