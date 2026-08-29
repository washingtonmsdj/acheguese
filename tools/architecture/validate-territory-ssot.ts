#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const RUNTIME_ROOTS = [
  path.join(ROOT, "src"),
  path.join(ROOT, "supabase", "functions"),
];
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

// Runtime callers of the old location-owned group repository are no longer
// allowed. The physical compatibility files are retired separately below.
const LEGACY_REPOSITORY_IMPORT_ALLOWLIST = new Set<string>();

// These paths are compatibility bridges only. They must point one-way to
// core/territorial and may not regain Supabase/group implementation.
const LEGACY_LOCATION_GROUP_BRIDGES = new Set([
  "src/core/location/repositories/ITerritorialGroupRepository.ts",
  "src/core/location/repositories/TerritorialGroupRepositorySupabase.ts",
  "src/core/location/repositories/createTerritorialGroupRepository.ts",
]);

// Hardened backend gateways are explicit operation owners, not alternate domain
// implementations. territorial-get-tree is read-only. Visibility mutations may
// update metadata only and are invoked through TerritorialManagementService.
const TERRITORIAL_BACKEND_GROUP_GATEWAYS = new Set([
  "supabase/functions/territorial-get-tree/index.ts",
  "supabase/functions/territorial-update-group-visibility/index.ts",
]);
const GROUP_VISIBILITY_EDGE =
  "supabase/functions/territorial-update-group-visibility/index.ts";
const LOCATION_VISIBILITY_EDGE =
  "supabase/functions/territorial-update-location-visibility/index.ts";
const LOCATION_STRUCTURAL_WRITER =
  "src/core/location/services/LocationAdminService.ts";
const LOCATION_BOUNDARY_WRITER =
  "src/core/geospatial/repositories/GeospatialRepositorySupabase.ts";

const LOCATION_TYPES = "src/core/location/types/index.ts";
const LANDING_SERVICE = "src/core/landing/services/LandingService.ts";
const TERRITORIAL_LANDING_ADAPTER = "src/core/landing/services/territorialLanding.queries.ts";
const CODE_FILE_RE = /\.(ts|tsx|js|jsx)$/;

type TableWriteOperation = "insert" | "update" | "upsert" | "delete";

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

function findTableWrites(content: string, table: string): TableWriteOperation[] {
  const escapedTable = table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const fromRe = new RegExp(
    `\\.from(?:<[^>]+>)?\\(\\s*["']${escapedTable}["']\\s*\\)`,
    "g",
  );
  const writes: TableWriteOperation[] = [];

  for (const match of content.matchAll(fromRe)) {
    const start = match.index ?? 0;
    const semicolon = content.indexOf(";", start);
    const end = semicolon === -1 ? Math.min(content.length, start + 2000) : semicolon + 1;
    const chain = content.slice(start, end);
    const operation = chain.match(/\.(insert|update|upsert|delete)\s*\(/)?.[1] as
      | TableWriteOperation
      | undefined;
    if (operation) writes.push(operation);
  }

  return writes;
}

function validateLocationWriter(
  relative: string,
  content: string,
  writes: TableWriteOperation[],
  violations: string[],
): void {
  if (writes.length === 0) return;

  if (relative === LOCATION_STRUCTURAL_WRITER) {
    if (!content.includes("TERRITORIAL_VISIBILITY_METADATA_KEYS")) {
      violations.push(
        `${relative}: structural location writer must preserve territorial visibility metadata ownership.`,
      );
    }
    if (!content.includes(".eq('metadata', toJsonMetadata(expectedMetadata))")) {
      violations.push(
        `${relative}: location metadata updates must use optimistic concurrency so visibility Edge Function writes cannot be lost.`,
      );
    }
    return;
  }

  if (relative === LOCATION_BOUNDARY_WRITER) {
    if (writes.some((operation) => operation !== "update")) {
      violations.push(`${relative}: geospatial location authority is update-only.`);
    }
    if (!content.includes("boundary: boundary as unknown")) {
      violations.push(`${relative}: geospatial location writer may update boundary only.`);
    }
    return;
  }

  if (relative === LOCATION_VISIBILITY_EDGE) {
    if (writes.some((operation) => operation !== "update")) {
      violations.push(`${relative}: territorial location visibility authority is metadata-update-only.`);
    }
    if (!content.includes("[canonicalFlag]: value")) {
      violations.push(`${relative}: visibility Edge Function must remain scoped to canonical metadata flags.`);
    }
    return;
  }

  violations.push(
    `${relative}: direct locations mutation is forbidden. Structural CRUD belongs to ${LOCATION_STRUCTURAL_WRITER}; boundary enrichment belongs to ${LOCATION_BOUNDARY_WRITER}; territorial visibility belongs to ${LOCATION_VISIBILITY_EDGE}.`,
  );
}

function main(): void {
  const violations: string[] = [];
  const seenRepositoryAllowlist = new Set<string>();

  for (const retired of RETIRED_LOCATION_GROUP_FILES) {
    if (fs.existsSync(path.join(ROOT, retired))) {
      violations.push(`${retired}: retired territorial-group artifact was recreated under core/location.`);
    }
  }

  const runtimeFiles = RUNTIME_ROOTS.flatMap(walk);

  for (const filePath of runtimeFiles) {
    const relative = normalize(path.relative(ROOT, filePath));
    const content = fs.readFileSync(filePath, "utf8");
    const isSourceFile = relative.startsWith("src/");

    if (isSourceFile && content.includes(RETIRED_GROUP_READ_SERVICE_IMPORT)) {
      violations.push(
        `${relative}: retired TerritorialGroupsReadService import is forbidden. Consume @/core/territorial instead.`,
      );
    }

    if (isSourceFile && content.includes(LEGACY_GROUP_REPOSITORY_IMPORT)) {
      if (!LEGACY_REPOSITORY_IMPORT_ALLOWLIST.has(relative)) {
        violations.push(
          `${relative}: direct import of the legacy territorial-group repository from core/location is forbidden. Consume @/core/territorial instead.`,
        );
      } else {
        seenRepositoryAllowlist.add(relative);
      }
    }

    if (GROUP_TABLE_ACCESS_RE.test(content)) {
      if (isSourceFile && !relative.startsWith(TERRITORIAL_OWNER_ROOT)) {
        violations.push(
          `${relative}: direct territorial-group table access is forbidden outside ${TERRITORIAL_OWNER_ROOT}. Delegate to the territorial owner.`,
        );
      }

      if (
        relative.startsWith("supabase/functions/") &&
        !TERRITORIAL_BACKEND_GROUP_GATEWAYS.has(relative)
      ) {
        violations.push(
          `${relative}: backend territorial-group table access is not an authorized gateway.`,
        );
      }
    }

    if (relative === GROUP_VISIBILITY_EDGE) {
      const groupWrites = findTableWrites(content, "territorial_groups");
      if (groupWrites.length === 0 || groupWrites.some((operation) => operation !== "update")) {
        violations.push(`${relative}: group visibility gateway must remain update-only.`);
      }
      if (!content.includes("[canonicalFlag]: value")) {
        violations.push(`${relative}: group visibility gateway must remain scoped to canonical metadata flags.`);
      }
    }

    const locationWrites = findTableWrites(content, "locations");
    validateLocationWriter(relative, content, locationWrites, violations);

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

  for (const bridge of LEGACY_LOCATION_GROUP_BRIDGES) {
    if (!fs.existsSync(path.join(ROOT, bridge))) {
      violations.push(`${bridge}: stale compatibility-bridge inventory. Remove it from validate-territory-ssot.ts.`);
    }
  }

  for (const gateway of TERRITORIAL_BACKEND_GROUP_GATEWAYS) {
    if (!fs.existsSync(path.join(ROOT, gateway))) {
      violations.push(`${gateway}: authorized territorial backend gateway is missing.`);
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

  const landingServicePath = path.join(ROOT, LANDING_SERVICE);
  const territorialLandingPath = path.join(ROOT, TERRITORIAL_LANDING_ADAPTER);
  if (!fs.existsSync(territorialLandingPath)) {
    violations.push(`${TERRITORIAL_LANDING_ADAPTER}: canonical Landing territorial adapter is missing.`);
  }
  if (fs.existsSync(landingServicePath)) {
    const landingService = fs.readFileSync(landingServicePath, "utf8");
    if (!landingService.includes('./territorialLanding.queries')) {
      violations.push(`${LANDING_SERVICE}: territorial Landing exports must come from territorialLanding.queries.`);
    }
  }

  if (violations.length > 0) {
    console.error("Territory SSOT violations:\n");
    for (const violation of violations) console.error(`- ${violation}`);
    process.exit(1);
  }

  console.log(
    "Territory SSOT valid: core/location owns structural geography; core/territorial owns groups and visibility orchestration; geospatial owns boundary enrichment only; hardened Edge Functions are explicit backend gateways; legacy group paths remain one-way bridges only.",
  );
}

main();