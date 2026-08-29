#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_ROOT = path.join(ROOT, "src");

const LEGACY_GROUP_REPOSITORY_IMPORT =
  "@/core/location/repositories/createTerritorialGroupRepository";
const LEGACY_GROUP_READ_SERVICE_IMPORT =
  "@/core/location/services/TerritorialGroupsReadService";

const RETIRED_LOCATION_GROUP_FILES = [
  "src/core/location/hooks/useTerritorialGroups.ts",
  "src/core/location/services/SelectorTerritoryService.ts",
] as const;

// Temporary, monotonic debt. Remove an entry as soon as the caller delegates to
// @/core/territorial. Stale entries intentionally fail the validator.
const LEGACY_REPOSITORY_IMPORT_ALLOWLIST = new Set([
  "src/core/business/services/BusinessUrlService.ts",
  "src/core/routing/hooks/useResolveTerritoryFromUrl.ts",
  "src/core/territorial/services/TerritorialGroupService.ts",
]);

const LEGACY_READ_SERVICE_IMPORT_ALLOWLIST = new Set([
  "src/core/routing/seo/generateSitemap.ts",
  "src/modules/admin/pages/AdminTerritoryContent.tsx",
]);

const LEGACY_LOCATION_GROUP_STORAGE = new Set([
  "src/core/location/repositories/ITerritorialGroupRepository.ts",
  "src/core/location/repositories/TerritorialGroupRepositorySupabase.ts",
  "src/core/location/repositories/createTerritorialGroupRepository.ts",
  "src/core/location/services/TerritorialGroupsReadService.ts",
]);

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
  const seenReadServiceAllowlist = new Set<string>();

  for (const retired of RETIRED_LOCATION_GROUP_FILES) {
    if (fs.existsSync(path.join(ROOT, retired))) {
      violations.push(`${retired}: retired territorial-group artifact was recreated under core/location.`);
    }
  }

  for (const filePath of walk(SRC_ROOT)) {
    const relative = normalize(path.relative(ROOT, filePath));
    const content = fs.readFileSync(filePath, "utf8");

    if (content.includes(LEGACY_GROUP_REPOSITORY_IMPORT)) {
      if (!LEGACY_REPOSITORY_IMPORT_ALLOWLIST.has(relative)) {
        violations.push(
          `${relative}: direct import of the legacy territorial-group repository from core/location is forbidden. Consume @/core/territorial instead.`,
        );
      } else {
        seenRepositoryAllowlist.add(relative);
      }
    }

    if (content.includes(LEGACY_GROUP_READ_SERVICE_IMPORT)) {
      if (!LEGACY_READ_SERVICE_IMPORT_ALLOWLIST.has(relative)) {
        violations.push(
          `${relative}: legacy TerritorialGroupsReadService import is forbidden. Consume @/core/territorial instead.`,
        );
      } else {
        seenReadServiceAllowlist.add(relative);
      }
    }

    if (
      relative.startsWith("src/core/location/") &&
      /TerritorialGroup/.test(path.basename(relative)) &&
      !LEGACY_LOCATION_GROUP_STORAGE.has(relative)
    ) {
      violations.push(
        `${relative}: new territorial-group implementation under core/location is forbidden; group ownership belongs to core/territorial.`,
      );
    }
  }

  for (const allowed of LEGACY_REPOSITORY_IMPORT_ALLOWLIST) {
    if (!seenRepositoryAllowlist.has(allowed)) {
      violations.push(
        `${allowed}: stale legacy repository allowlist entry. Remove it from validate-territory-ssot.ts.`,
      );
    }
  }

  for (const allowed of LEGACY_READ_SERVICE_IMPORT_ALLOWLIST) {
    if (!seenReadServiceAllowlist.has(allowed)) {
      violations.push(
        `${allowed}: stale legacy read-service allowlist entry. Remove it from validate-territory-ssot.ts.`,
      );
    }
  }

  for (const legacyStorage of LEGACY_LOCATION_GROUP_STORAGE) {
    if (!fs.existsSync(path.join(ROOT, legacyStorage))) {
      violations.push(
        `${legacyStorage}: stale legacy storage allowlist entry. Remove it from validate-territory-ssot.ts.`,
      );
    }
  }

  if (violations.length > 0) {
    console.error("Territory SSOT violations:\n");
    for (const violation of violations) console.error(`- ${violation}`);
    process.exit(1);
  }

  console.log(
    "Territory SSOT valid: core/location owns geographic hierarchy; core/territorial owns territorial groups; legacy group paths are frozen to a monotonic allowlist.",
  );
}

main();
