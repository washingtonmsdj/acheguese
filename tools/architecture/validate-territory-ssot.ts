#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_ROOT = path.join(ROOT, "src");
const TERRITORIAL_OWNER_ROOT = "src/core/territorial/";

const LEGACY_GROUP_REPOSITORY_IMPORT =
  "@/core/location/repositories/createTerritorialGroupRepository";
const RETIRED_GROUP_READ_SERVICE_IMPORT =
  "@/core/location/services/TerritorialGroupsReadService";
const GROUP_TABLE_ACCESS_RE = /\.from(?:<[^>]+>)?\(\s*["']territorial_group(?:s|_members)["']\s*\)/;

const RETIRED_LOCATION_GROUP_FILES = [
  "src/core/location/hooks/useTerritorialGroups.ts",
  "src/core/location/services/SelectorTerritoryService.ts",
  "src/core/location/services/TerritorialGroupsReadService.ts",
] as const;

// Temporary, monotonic caller debt. Remove an entry as soon as the caller
// delegates to @/core/territorial. Stale entries intentionally fail.
const LEGACY_REPOSITORY_IMPORT_ALLOWLIST = new Set([
  "src/core/business/services/BusinessUrlService.ts",
  "src/core/routing/hooks/useResolveTerritoryFromUrl.ts",
]);

// One known cross-owner read model still queries group tables directly. It is
// frozen here until landing delegates to core/territorial.
const GROUP_TABLE_ACCESS_ALLOWLIST = new Set([
  "src/core/landing/services/landing.queries.ts",
]);

// These paths are compatibility bridges only. They must point one-way to
// core/territorial and may not regain Supabase/group implementation.
const LEGACY_LOCATION_GROUP_BRIDGES = new Set([
  "src/core/location/repositories/ITerritorialGroupRepository.ts",
  "src/core/location/repositories/TerritorialGroupRepositorySupabase.ts",
  "src/core/location/repositories/createTerritorialGroupRepository.ts",
]);

const LOCATION_TYPES = "src/core/location/types/index.ts";
const CODE_FILE_RE = /\.(ts|tsx|js|jsx)$/;

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
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.isFile() && isRuntimeCodeFile(fullPath)) files.push(fullPath);
  }
  return files;
}

function main(): void {
  const violations: string[] = [];
  const seenRepositoryAllowlist = new Set<string>();
  const seenGroupTableAllowlist = new Set<string>();

  for (const retired of RETIRED_LOCATION_GROUP_FILES) {
    if (fs.existsSync(path.join(ROOT, retired))) {
      violations.push(`${retired}: retired territorial-group artifact was recreated under core/location.`);
    }
  }

  for (const filePath of walk(SRC_ROOT)) {
    const relative = normalize(path.relative(ROOT, filePath));
    const content = fs.readFileSync(filePath, "utf8");

    if (content.includes(RETIRED_GROUP_READ_SERVICE_IMPORT)) {
      violations.push(
        `${relative}: retired TerritorialGroupsReadService import is forbidden. Consume @/core/territorial instead.`,
      );
    }

    if (content.includes(LEGACY_GROUP_REPOSITORY_IMPORT)) {
      if (!LEGACY_REPOSITORY_IMPORT_ALLOWLIST.has(relative)) {
        violations.push(
          `${relative}: direct import of the legacy territorial-group repository from core/location is forbidden. Consume @/core/territorial instead.`,
        );
      } else {
        seenRepositoryAllowlist.add(relative);
      }
    }

    if (GROUP_TABLE_ACCESS_RE.test(content) && !relative.startsWith(TERRITORIAL_OWNER_ROOT)) {
      if (!GROUP_TABLE_ACCESS_ALLOWLIST.has(relative)) {
        violations.push(
          `${relative}: direct territorial-group table access is forbidden outside ${TERRITORIAL_OWNER_ROOT}. Delegate to the territorial owner.`,
        );
      } else {
        seenGroupTableAllowlist.add(relative);
      }
    }

    if (LEGACY_LOCATION_GROUP_BRIDGES.has(relative)) {
      if (!content.includes("@/core/territorial")) {
        violations.push(
          `${relative}: compatibility bridge must delegate one-way to core/territorial.`,
        );
      }
      if (GROUP_TABLE_ACCESS_RE.test(content)) {
        violations.push(
          `${relative}: compatibility bridge may not contain territorial-group persistence.`,
        );
      }
      continue;
    }

    if (
      relative.startsWith("src/core/location/") &&
      /TerritorialGroup/.test(path.basename(relative))
    ) {
      violations.push(
        `${relative}: new territorial-group implementation under core/location is forbidden; group ownership belongs to core/territorial.`,
      );
    }
  }

  for (const allowed of LEGACY_REPOSITORY_IMPORT_ALLOWLIST) {
    if (!seenRepositoryAllowlist.has(allowed)) {
      violations.push(`${allowed}: stale legacy repository allowlist entry. Remove it from validate-territory-ssot.ts.`);
    }
  }

  for (const allowed of GROUP_TABLE_ACCESS_ALLOWLIST) {
    if (!seenGroupTableAllowlist.has(allowed)) {
      violations.push(`${allowed}: stale territorial-group table-access allowlist entry. Remove it from validate-territory-ssot.ts.`);
    }
  }

  for (const bridge of LEGACY_LOCATION_GROUP_BRIDGES) {
    if (!fs.existsSync(path.join(ROOT, bridge))) {
      violations.push(`${bridge}: stale compatibility-bridge inventory. Remove it from validate-territory-ssot.ts.`);
    }
  }

  const locationTypesPath = path.join(ROOT, LOCATION_TYPES);
  if (fs.existsSync(locationTypesPath)) {
    const locationTypes = fs.readFileSync(locationTypesPath, "utf8");
    if (/export\s+interface\s+TerritorialGroup\b/.test(locationTypes)) {
      violations.push(`${LOCATION_TYPES}: TerritorialGroup must not be declared by core/location.`);
    }
    if (/export\s+const\s+TERRITORIAL_GROUP_STATUS\b/.test(locationTypes)) {
      violations.push(`${LOCATION_TYPES}: territorial group status must be owned by core/territorial.`);
    }
    if (!locationTypes.includes("@/core/territorial/contracts")) {
      violations.push(`${LOCATION_TYPES}: temporary group compatibility types must re-export core/territorial contracts.`);
    }
  }

  if (violations.length > 0) {
    console.error("Territory SSOT violations:\n");
    for (const violation of violations) console.error(`- ${violation}`);
    process.exit(1);
  }

  console.log(
    "Territory SSOT valid: core/location owns geographic hierarchy; core/territorial owns territorial groups; remaining repository bridges and the landing read-model debt are monotonic.",
  );
}

main();
