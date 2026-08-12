#!/usr/bin/env node

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { classifySupabaseCliFailure } from "./lib/supabase-cli-validation-state.mjs";
import { parseSupabaseQueryRows } from "./lib/supabase-cli-query-json.mjs";
import { runSupabaseCli } from "./lib/supabase-cli-runner.mjs";

export const CANONICAL_SALVADOR_ID = "63c41c29-adce-40f5-a552-e52d176123c3";
export const LEGACY_SALVADOR_ID = "00000000-0000-0000-0000-000000000001";
export const TARGET_COMMUNITY_SLUGS = [
  "barra",
  "pituba",
  "rio-vermelho",
  "itapua",
  "cabula",
  "federacao",
  "brotas",
  "liberdade",
  "centro-historico",
  "boca-do-rio",
  "stiep",
  "costa-azul",
  "ondina",
  "nazare",
  "bonfim",
];

const LEGACY_LOCATION_IDS = [
  LEGACY_SALVADOR_ID,
  "00000000-0000-0000-0000-000000000002",
  "00000000-0000-0000-0000-000000000003",
];

function quoteLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function extractTargetNeighborhoodSlugs(sql) {
  return Array.from(
    sql.matchAll(/VALUES \(v_salvador_id, 'neighborhood', '([^']+)'/g),
    (match) => match[1],
  );
}

export function evaluateSalvadorSeedConflictArbiters(sql) {
  const issues = [];
  const locationInserts = Array.from(
    sql.matchAll(/INSERT\s+INTO\s+(?:public\.)?locations\b[\s\S]*?;/gi),
    (match) => match[0],
  );
  const communityInserts = Array.from(
    sql.matchAll(
      /INSERT\s+INTO\s+(?:public\.)?territory_communities\b[\s\S]*?;/gi,
    ),
    (match) => match[0],
  );
  const locationArbiter =
    /ON\s+CONFLICT\s*\(\s*slug\s*,\s*parent_id\s*\)\s*WHERE\s+parent_id\s+IS\s+NOT\s+NULL\s*DO\s+NOTHING\s*;/i;
  const communityArbiter =
    /ON\s+CONFLICT\s*\(\s*slug\s*,\s*city_id\s*\)\s*DO\s+NOTHING\s*;/i;

  if (locationInserts.length !== 170) {
    issues.push("location_insert_count");
  }
  if (locationInserts.some((statement) => !locationArbiter.test(statement))) {
    issues.push("location_partial_unique_arbiter");
  }
  if (communityInserts.length !== 15) {
    issues.push("community_insert_count");
  }
  if (communityInserts.some((statement) => !communityArbiter.test(statement))) {
    issues.push("community_unique_arbiter");
  }
  if ((sql.match(/\bON\s+CONFLICT\b/gi) ?? []).length !== 185) {
    issues.push("conflict_clause_count");
  }
  if (/\bON\s+CONFLICT\s+DO\b/i.test(sql)) {
    issues.push("generic_conflict_target");
  }

  return {
    issues,
    status:
      issues.length === 0
        ? "SALVADOR_SEED_CONFLICT_ARBITER_PASS"
        : "SALVADOR_SEED_CONFLICT_ARBITER_BLOCKED",
  };
}

export function buildLocationFkCatalogSql() {
  return `
select coalesce(jsonb_agg(fk order by source_table, source_column), '[]'::jsonb) as location_fks
from (
  select distinct
    source_namespace.nspname as source_schema,
    source_table.relname as source_table,
    source_column.attname as source_column
  from pg_catalog.pg_constraint constraint_definition
  join pg_catalog.pg_class source_table
    on source_table.oid = constraint_definition.conrelid
  join pg_catalog.pg_namespace source_namespace
    on source_namespace.oid = source_table.relnamespace
  join pg_catalog.pg_class target_table
    on target_table.oid = constraint_definition.confrelid
  join pg_catalog.pg_namespace target_namespace
    on target_namespace.oid = target_table.relnamespace
  join lateral unnest(constraint_definition.conkey) as source_key(attnum) on true
  join pg_catalog.pg_attribute source_column
    on source_column.attrelid = source_table.oid
   and source_column.attnum = source_key.attnum
  where constraint_definition.contype = 'f'
    and target_namespace.nspname = 'public'
    and target_table.relname = 'locations'
    and not (
      source_namespace.nspname = 'public'
      and source_table.relname = 'locations'
      and source_column.attname = 'parent_id'
    )
) fk;
`.trim();
}

export function buildUnexpectedReferenceSql(locationFks) {
  if (!Array.isArray(locationFks))
    throw new Error("locationFks must be an array");

  const legacyIds = LEGACY_LOCATION_IDS.map(
    (id) => `${quoteLiteral(id)}::uuid`,
  ).join(", ");
  const parts = locationFks.map((fk) => {
    const schema = quoteIdentifier(fk.source_schema);
    const table = quoteIdentifier(fk.source_table);
    const column = quoteIdentifier(fk.source_column);
    return `select count(*)::bigint as row_count from ${schema}.${table} where ${column} = any (array[${legacyIds}])`;
  });

  if (parts.length === 0)
    return "select 0::bigint as unexpected_fk_references;";
  return `select coalesce(sum(row_count), 0)::bigint as unexpected_fk_references from (${parts.join(" union all ")}) references_to_legacy;`;
}

export function buildSalvadorInventorySql(neighborhoodSlugs) {
  if (
    neighborhoodSlugs.length !== 170 ||
    new Set(neighborhoodSlugs).size !== 170
  ) {
    throw new Error(
      "The Salvador seed must declare exactly 170 unique neighborhoods.",
    );
  }

  const neighborhoods = neighborhoodSlugs.map(quoteLiteral).join(", ");
  const communities = TARGET_COMMUNITY_SLUGS.map(quoteLiteral).join(", ");
  return `
with expected_neighborhoods(slug) as (
  select unnest(array[${neighborhoods}]::text[])
), expected_communities(slug) as (
  select unnest(array[${communities}]::text[])
)
select
  (select count(*) from public.locations where type = 'city' and slug = 'salvador') as salvador_slug_count,
  (
    select count(*)
    from public.locations city
    join public.locations state on state.id = city.parent_id
    join public.locations country on country.id = state.parent_id
    where city.id = '${CANONICAL_SALVADOR_ID}'::uuid
      and city.type = 'city'
      and city.slug = 'salvador'
      and city.geographic_path = '/br/ba/salvador'
      and city.status = 'active'
      and city.metadata->>'ibge_code' = '2927408'
      and state.id = '35448ab5-6028-47a8-85d3-af2d212d1cb4'::uuid
      and state.slug = 'ba'
      and state.geographic_path = '/br/ba'
      and country.id = '69d56449-0d83-468f-8f65-7339bb1c2ea2'::uuid
      and country.slug = 'br'
      and country.geographic_path = '/br'
  ) as canonical_hierarchy_count,
  (select count(*) from public.locations where id = '${LEGACY_SALVADOR_ID}'::uuid and slug = 'salvador' and status = 'inactive') as legacy_prestate_count,
  (select count(*) from public.locations where id = '${LEGACY_SALVADOR_ID}'::uuid and slug = 'salvador-legacy-fase2' and status = 'inactive') as legacy_archived_count,
  (select count(*) from public.locations where parent_id = '${LEGACY_SALVADOR_ID}'::uuid) as legacy_child_count,
  (
    select count(*)
    from public.locations
    where parent_id = '${LEGACY_SALVADOR_ID}'::uuid
      and slug in ('barra', 'pelourinho')
  ) as legacy_live_slug_count,
  (
    select count(*)
    from expected_neighborhoods expected
    join public.locations location
      on location.parent_id = '${CANONICAL_SALVADOR_ID}'::uuid
     and location.slug = expected.slug
  ) as canonical_neighborhood_count,
  (
    select count(*)
    from expected_neighborhoods expected
    join public.locations location
      on location.parent_id = '${CANONICAL_SALVADOR_ID}'::uuid
     and location.slug = expected.slug
    where location.type <> 'neighborhood'
       or location.geographic_path <> '/br/ba/salvador/' || expected.slug
  ) as canonical_neighborhood_conflicts,
  (
    select count(*)
    from expected_neighborhoods expected
    join public.locations canonical
      on canonical.parent_id = '${CANONICAL_SALVADOR_ID}'::uuid
     and canonical.slug = expected.slug
    join public.locations legacy
      on legacy.parent_id = '${LEGACY_SALVADOR_ID}'::uuid
     and legacy.slug = expected.slug
  ) as split_neighborhood_slugs,
  (
    select count(*)
    from public.territory_communities community
    join expected_communities expected on expected.slug = community.slug
    where community.city_id = '${CANONICAL_SALVADOR_ID}'::uuid
  ) as canonical_target_communities,
  (
    select count(*)
    from public.territory_communities community
    join expected_communities expected on expected.slug = community.slug
    left join public.locations territory on territory.id = community.territory_id
    where community.city_id = '${CANONICAL_SALVADOR_ID}'::uuid
      and (
        community.territory_type <> 'neighborhood'
        or territory.id is null
        or territory.parent_id <> '${CANONICAL_SALVADOR_ID}'::uuid
        or territory.type <> 'neighborhood'
        or territory.slug <> community.slug
      )
  ) as canonical_community_conflicts,
  (
    select count(*)
    from public.territory_communities community
    join expected_communities expected on expected.slug = community.slug
    where community.city_id = '${LEGACY_SALVADOR_ID}'::uuid
  ) as legacy_target_communities,
  (
    (select count(*) from public.businesses where location_id = any (array[${LEGACY_LOCATION_IDS.map((id) => `${quoteLiteral(id)}::uuid`).join(", ")}]))
    + (select count(*) from public.territory_communities where territory_id = any (array[${LEGACY_LOCATION_IDS.map((id) => `${quoteLiteral(id)}::uuid`).join(", ")}]))
    + (select count(*) from public.community_entity_links where entity_type = 'location' and entity_id = any (array[${LEGACY_LOCATION_IDS.map((id) => `${quoteLiteral(id)}::uuid`).join(", ")}]))
  ) as unexpected_non_fk_references;
`.trim();
}

function numeric(row, key) {
  const value = Number(row[key] ?? 0);
  return Number.isFinite(value) ? value : Number.NaN;
}

export function evaluateSalvadorPreflight({ inventory, references }) {
  const blockers = [];
  const prestate = numeric(inventory, "legacy_prestate_count") === 1;
  const poststate = numeric(inventory, "legacy_archived_count") === 1;
  const expectedSalvadorCount = prestate ? 2 : 1;
  const expectedLegacyLiveSlugs = prestate ? 2 : 0;
  const expectedSplitSlugs = prestate ? 1 : 0;

  const exactChecks = {
    canonical_hierarchy_count: 1,
    canonical_neighborhood_count: 170,
    canonical_neighborhood_conflicts: 0,
    canonical_community_conflicts: 0,
    legacy_child_count: 2,
    legacy_live_slug_count: expectedLegacyLiveSlugs,
    legacy_target_communities: 0,
    salvador_slug_count: expectedSalvadorCount,
    split_neighborhood_slugs: expectedSplitSlugs,
    unexpected_non_fk_references: 0,
  };

  if (prestate === poststate) blockers.push("legacy_state");
  for (const [key, expected] of Object.entries(exactChecks)) {
    if (numeric(inventory, key) !== expected) blockers.push(key);
  }

  const canonicalCommunities = numeric(
    inventory,
    "canonical_target_communities",
  );
  if (canonicalCommunities < 1 || canonicalCommunities > 15) {
    blockers.push("canonical_target_communities");
  }
  if (numeric(references, "unexpected_fk_references") !== 0) {
    blockers.push("unexpected_fk_references");
  }

  return {
    blockers,
    inventory,
    references,
    stage: prestate
      ? "PRE_RECONCILIATION"
      : poststate
        ? "POST_RECONCILIATION"
        : "UNKNOWN",
    status:
      blockers.length === 0
        ? "SALVADOR_PREFLIGHT_PASS"
        : "SALVADOR_PREFLIGHT_BLOCKED",
  };
}

function runSupabaseQuery(sql) {
  const tempDir = mkdtempSync(join(tmpdir(), "achegue-salvador-preflight-"));
  const sqlPath = join(tempDir, "preflight.sql");
  writeFileSync(sqlPath, sql);
  try {
    const result = runSupabaseCli(
      ["db", "query", "--linked", "--output", "json", "--file", sqlPath],
      {
        cwd: process.cwd(),
      },
    );
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    if (result.error) throw new Error(`LOCAL_FAILURE: ${result.error.message}`);
    if (result.status !== 0) {
      throw new Error(
        `${classifySupabaseCliFailure(output)}: Salvador read-only preflight unavailable.\n${output.trim()}`,
      );
    }
    return parseSupabaseQueryRows(output);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function main() {
  const seedPath = join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260720100000_seed_salvador_neighborhoods_and_top15_communities.sql",
  );
  const seed = readFileSync(seedPath, "utf8");
  const arbiterResult = evaluateSalvadorSeedConflictArbiters(seed);
  console.log(arbiterResult.status);
  if (arbiterResult.status === "SALVADOR_SEED_CONFLICT_ARBITER_BLOCKED") {
    throw new Error(arbiterResult.issues.join(", "));
  }
  if (process.argv.includes("--conflict-arbiter-only")) return;

  const slugs = extractTargetNeighborhoodSlugs(seed);
  const [catalog = {}] = runSupabaseQuery(buildLocationFkCatalogSql());
  const locationFks = Array.isArray(catalog.location_fks)
    ? catalog.location_fks
    : [];
  const [references = {}] = runSupabaseQuery(
    buildUnexpectedReferenceSql(locationFks),
  );
  const [inventory = {}] = runSupabaseQuery(buildSalvadorInventorySql(slugs));
  const result = evaluateSalvadorPreflight({ inventory, references });
  console.log(JSON.stringify(result, null, 2));
  console.log(result.status);
  if (result.status === "SALVADOR_PREFLIGHT_BLOCKED") process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error("SALVADOR_PREFLIGHT_BLOCKED");
    process.exit(1);
  }
}
