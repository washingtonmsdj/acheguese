import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const modulePath = "../../scripts/salvador-preflight.mjs";
const canonicalId = "63c41c29-adce-40f5-a552-e52d176123c3";
const legacyId = "00000000-0000-0000-0000-000000000001";
const migrationPath = join(
  process.cwd(),
  "supabase/migrations/20260719122000_reconcile_canonical_salvador.sql",
);
const seedPath = join(
  process.cwd(),
  "supabase/migrations/20260720100000_seed_salvador_neighborhoods_and_top15_communities.sql",
);

type SalvadorModule = {
  buildLocationFkCatalogSql: () => string;
  buildSalvadorInventorySql: (slugs: string[]) => string;
  buildUnexpectedReferenceSql: (fks: Array<Record<string, string>>) => string;
  evaluateSalvadorPreflight: (input: {
    inventory: Record<string, number>;
    references: Record<string, number>;
  }) => { blockers: string[]; stage: string; status: string };
  extractTargetNeighborhoodSlugs: (sql: string) => string[];
};

async function loadModule(): Promise<SalvadorModule> {
  return (await import(modulePath)) as SalvadorModule;
}

const healthyPrestate = {
  canonical_community_conflicts: 0,
  canonical_hierarchy_count: 1,
  canonical_neighborhood_conflicts: 0,
  canonical_neighborhood_count: 170,
  canonical_target_communities: 1,
  legacy_archived_count: 0,
  legacy_child_count: 2,
  legacy_live_slug_count: 2,
  legacy_prestate_count: 1,
  legacy_target_communities: 0,
  salvador_slug_count: 2,
  split_neighborhood_slugs: 1,
  unexpected_non_fk_references: 0,
};

describe("Salvador canonical reconciliation", () => {
  it("does not choose arbitrarily when two Salvador rows exist", () => {
    const migration = readFileSync(migrationPath, "utf8");
    const seed = readFileSync(seedPath, "utf8");

    expect(migration).toContain(canonicalId);
    expect(migration).toContain(legacyId);
    expect(migration).not.toMatch(/LIMIT\s+1/i);
    expect(seed).not.toMatch(/LIMIT\s+1/i);
  });

  it("accepts only the deterministic audited pre-state", async () => {
    const { evaluateSalvadorPreflight } = await loadModule();
    const result = evaluateSalvadorPreflight({
      inventory: healthyPrestate,
      references: { unexpected_fk_references: 0 },
    });

    expect(result).toMatchObject({
      blockers: [],
      stage: "PRE_RECONCILIATION",
      status: "SALVADOR_PREFLIGHT_PASS",
    });
  });

  it("archives the known duplicate records while preserving their UUIDs", () => {
    const migration = readFileSync(migrationPath, "utf8");

    expect(migration).toContain("salvador-legacy-fase2");
    expect(migration).toContain("barra-legacy-fase2");
    expect(migration).toContain("pelourinho-legacy-fase2");
    expect(migration).not.toMatch(/\bDELETE\b/i);
  });

  it("blocks unknown dependencies and neighborhood conflicts", async () => {
    const { evaluateSalvadorPreflight } = await loadModule();
    const result = evaluateSalvadorPreflight({
      inventory: {
        ...healthyPrestate,
        canonical_neighborhood_conflicts: 1,
      },
      references: { unexpected_fk_references: 2 },
    });

    expect(result.status).toBe("SALVADOR_PREFLIGHT_BLOCKED");
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        "canonical_neighborhood_conflicts",
        "unexpected_fk_references",
      ]),
    );
  });

  it("pins the pending seed to the canonical country/state/city hierarchy", () => {
    const seed = readFileSync(seedPath, "utf8");

    expect(seed).toContain(canonicalId);
    expect(seed).toContain("city.metadata->>'ibge_code' = '2927408'");
    expect(seed).toContain("city.geographic_path = '/br/ba/salvador'");
  });

  it("cannot create a third Salvador city", () => {
    const seed = readFileSync(seedPath, "utf8");

    expect(seed).not.toMatch(
      /INSERT\s+INTO\s+(?:public\.)?locations[\s\S]{0,300}'city'/i,
    );
    expect(seed).toContain("exactly one city/slug=salvador");
  });

  it("declares 170 unique canonical neighborhoods without cross-root updates", async () => {
    const { extractTargetNeighborhoodSlugs } = await loadModule();
    const seed = readFileSync(seedPath, "utf8");
    const slugs = extractTargetNeighborhoodSlugs(seed);

    expect(slugs).toHaveLength(170);
    expect(new Set(slugs).size).toBe(170);
    expect(
      seed.match(/ON CONFLICT \(parent_id, slug\) DO NOTHING;/g),
    ).toHaveLength(170);
  });

  it("pins all 15 communities to canonical neighborhood IDs", () => {
    const seed = readFileSync(seedPath, "utf8");

    expect(
      seed.match(/c\.id = '63c41c29-adce-40f5-a552-e52d176123c3'::uuid/g),
    ).toHaveLength(15);
    expect(seed.match(/d\.type = 'neighborhood'/g)).toHaveLength(15);
    expect(
      seed.match(/ON CONFLICT \(slug, city_id\) DO NOTHING;/g),
    ).toHaveLength(15);
  });

  it("accepts the idempotent post-state and builds read-only probes", async () => {
    const {
      buildLocationFkCatalogSql,
      buildSalvadorInventorySql,
      buildUnexpectedReferenceSql,
      evaluateSalvadorPreflight,
      extractTargetNeighborhoodSlugs,
    } = await loadModule();
    const seed = readFileSync(seedPath, "utf8");
    const poststate = {
      ...healthyPrestate,
      canonical_target_communities: 15,
      legacy_archived_count: 1,
      legacy_live_slug_count: 0,
      legacy_prestate_count: 0,
      salvador_slug_count: 1,
      split_neighborhood_slugs: 0,
    };
    const result = evaluateSalvadorPreflight({
      inventory: poststate,
      references: { unexpected_fk_references: 0 },
    });
    const sql = [
      buildLocationFkCatalogSql(),
      buildUnexpectedReferenceSql([]),
      buildSalvadorInventorySql(extractTargetNeighborhoodSlugs(seed)),
    ].join("\n");

    expect(result).toMatchObject({
      blockers: [],
      stage: "POST_RECONCILIATION",
      status: "SALVADOR_PREFLIGHT_PASS",
    });
    expect(sql).toMatch(/\bselect\b/i);
    expect(sql).not.toMatch(
      /\b(?:insert|update|delete|alter|create|drop|truncate|grant|revoke|call)\b/i,
    );
  });
});
