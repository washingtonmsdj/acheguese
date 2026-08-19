import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const BASELINE = "20260818221457_dedupe_exact_rls_policies_batch1.sql";
const TERRITORY_DEDUPE =
  "20260819080218_dedupe_territory_ai_content_public_read_policy.sql";

const BASELINE_REDUNDANT_POLICIES = [
  "Products viewable",
  "Services viewable",
  "driver_locations_select_policy",
  "Admins podem gerenciar locations",
  "Admins veem todas as locations",
  "Admins podem suspender perfis",
  "Admins veem todos os perfis",
  "Usuários veem seus próprios perfis completos",
] as const;

const TERRITORY_REDUNDANT_POLICY = "public_read_territory_ai_content";
const REDUNDANT_POLICIES = [
  ...BASELINE_REDUNDANT_POLICIES,
  TERRITORY_REDUNDANT_POLICY,
] as const;

function migrationsFromBaseline() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql") && name >= BASELINE)
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS_DIR, name), "utf8"),
    }));
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("SEC-008 exact RLS policy dedupe", () => {
  it("keeps the remote dedupe migration versioned", () => {
    const baseline = migrationsFromBaseline().find(({ name }) => name === BASELINE);
    expect(baseline, `${BASELINE} must remain versioned`).toBeDefined();

    for (const policy of BASELINE_REDUNDANT_POLICIES) {
      expect(baseline?.sql).toContain(policy);
    }
    expect(baseline?.sql).toContain("is distinct from");
  });

  it("keeps the final territory AI exact dedupe fail-closed", () => {
    const migration = migrationsFromBaseline().find(
      ({ name }) => name === TERRITORY_DEDUPE,
    );

    expect(migration, `${TERRITORY_DEDUPE} must remain versioned`).toBeDefined();
    expect(migration?.sql).toContain("Anyone reads territory content");
    expect(migration?.sql).toContain(TERRITORY_REDUNDANT_POLICY);
    expect(migration?.sql).toContain("is distinct from");
    expect(migration?.sql).toContain(
      'drop policy "public_read_territory_ai_content" on public.territory_ai_content',
    );
  });

  it("does not silently recreate a removed redundant policy later", () => {
    const later = migrationsFromBaseline().filter(({ name }) => name !== BASELINE);
    const regressions: string[] = [];

    for (const { name, sql } of later) {
      for (const policy of REDUNDANT_POLICIES) {
        const createPolicy = new RegExp(
          `create\\s+policy\\s+["']?${escapeRegex(policy)}["']?`,
          "i",
        );
        if (createPolicy.test(sql)) regressions.push(`${name}: ${policy}`);
      }
    }

    expect(
      regressions,
      "exact duplicate RLS policies must not be reintroduced without explicit review",
    ).toEqual([]);
  });
});
