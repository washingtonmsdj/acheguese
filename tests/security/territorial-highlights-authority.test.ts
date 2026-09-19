import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migrationsDir = resolve(root, "supabase/migrations");
const migrationName =
  "20260918133432_repair_territorial_highlights_contract.sql";

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("territorial highlights authority", () => {
  const migration = read(`supabase/migrations/${migrationName}`);
  const repository = read(
    "src/core/territorial/highlights/TerritorialHighlightRepositorySupabase.ts",
  );
  const broker = read("supabase/functions/admin-highlights-rpc/index.ts");
  const config = read("supabase/config.toml");
  const edgePolicy = read(
    "docs/09-reference/governance/security/EDGE_FUNCTION_AUTH_POLICY.json",
  );
  const generatedTypes = read(
    "src/integrations/supabase/types.generated.ts",
  );

  it("repairs the live schema required by the active UI contract", () => {
    for (const column of [
      "highlight_type",
      "entity_id",
      "subtitle",
      "image_url",
      "cta_label",
      "cta_url",
    ]) {
      expect(migration).toContain(`ADD COLUMN IF NOT EXISTS ${column}`);
      expect(generatedTypes).toContain(`${column}:`);
    }

    expect(migration).toContain("SET subtitle = description");
    expect(migration).toContain(
      "territorial_highlights_highlight_type_check",
    );
    expect(migration).toContain("territorial_highlights_cta_pair_check");
  });

  it("keeps only active/current rows on the browser-readable public path", () => {
    expect(migration).toContain(
      "CREATE POLICY territorial_highlights_public_valid_read",
    );
    expect(migration).toContain("FOR SELECT TO anon, authenticated");
    expect(migration).toContain("status = 'active'");
    expect(migration).toContain("starts_at IS NULL OR starts_at <= now()");
    expect(migration).toContain("ends_at IS NULL OR ends_at > now()");
    expect(migration).not.toMatch(
      /CREATE POLICY[\s\S]{0,240}territorial_highlights[\s\S]{0,240}USING\s*\(\s*true\s*\)/i,
    );

    expect(repository).toContain("PUBLIC_HIGHLIGHT_COLUMNS");
    expect(repository).toContain(".select(PUBLIC_HIGHLIGHT_COLUMNS)");
    expect(repository).not.toContain(".select('*')");
    expect(repository).not.toContain('.select("*")');
  });

  it("keeps legacy/internal presentation metadata outside the browser projection", () => {
    for (const hidden of ["description", "icon", "color", "metadata"]) {
      expect(migration).toContain(`('${hidden}')`);
    }

    expect(migration).toContain(
      "legacy/internal highlight columns remain browser-readable",
    );
    expect(repository).not.toContain("'metadata',");
    expect(repository).not.toContain("'description',");
    expect(repository).not.toContain("'icon',");
    expect(repository).not.toContain("'color',");
  });

  it("routes complete admin reads and every mutation through the MFA admin broker", () => {
    expect(config).toMatch(
      /\[functions\.admin-highlights-rpc\][\s\S]*?verify_jwt\s*=\s*true/,
    );
    expect(edgePolicy).toContain('"admin-highlights-rpc"');
    expect(edgePolicy).toContain(
      '"admin territorial highlights lifecycle broker"',
    );

    expect(repository).toContain("'admin-highlights-rpc'");
    expect(repository).toContain("action: 'listAll'");
    expect(repository).toContain("action: 'getById'");
    expect(repository).toContain("action: 'create'");
    expect(repository).toContain("action: 'update'");
    expect(repository).toContain("action: 'delete'");
    expect(repository).not.toContain(".insert(");
    expect(repository).not.toContain(".update(");
    expect(repository).not.toContain(".delete()");

    expect(broker).toContain("requireAdmin(req, ALLOWED_METHODS)");
    expect(broker).toContain("getSupabaseAdminClient()");
    expect(broker).toContain('resource: "admin-highlights-rpc"');
    expect(broker).toContain("rateLimitMiddleware(");
    expect(broker).toContain('.from("territorial_highlights")');
  });

  it("validates territorial and editorial inputs before service-role writes", () => {
    for (const value of [
      "business",
      "service",
      "classified",
      "event",
      "creator",
      "notice",
    ]) {
      expect(broker).toContain(`"${value}"`);
    }

    expect(broker).toContain('new Set(["location", "group"])');
    expect(broker).toContain('new Set(["active", "inactive"])');
    expect(broker).toContain("isValidUUID(value)");
    expect(broker).toContain("Highlight CTA label and URL must be provided together");
    expect(broker).toContain("Highlight start must be before highlight end");
    expect(broker).toContain('const table = territoryType === "location" ? "locations" : "territorial_groups"');
  });

  it("prevents later migrations from reopening browser DML or broad public reads", () => {
    const offenders: string[] = [];
    const later = readdirSync(migrationsDir)
      .filter((name) => name.endsWith(".sql") && name > migrationName)
      .sort();

    for (const name of later) {
      const sql = readFileSync(resolve(migrationsDir, name), "utf8");

      if (
        /GRANT\s+(?:INSERT|UPDATE|DELETE|ALL(?:\s+PRIVILEGES)?)\s+ON\s+(?:TABLE\s+)?public\.territorial_highlights\s+TO\s+[^;]*(?:\banon\b|\bauthenticated\b|\bPUBLIC\b)/i.test(
          sql,
        )
      ) {
        offenders.push(`${name}: browser DML`);
      }

      if (
        /CREATE\s+POLICY[\s\S]{0,260}ON\s+public\.territorial_highlights[\s\S]{0,260}FOR\s+SELECT[\s\S]{0,260}USING\s*\(\s*true\s*\)/i.test(
          sql,
        )
      ) {
        offenders.push(`${name}: broad public SELECT policy`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
