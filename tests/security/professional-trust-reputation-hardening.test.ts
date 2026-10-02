import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const HARDENING_MIGRATION =
  "20261002175500_harden_professional_trust_reputation_search_path.sql";
const SOURCE_MIGRATION = "20260715109000_consolidate_trust_commands.sql";

function migration(name: string): string {
  return readFileSync(join(ROOT, "supabase", "migrations", name), "utf8");
}

describe("professional trust reputation SECURITY DEFINER hardening", () => {
  it("pins the public RPC to an empty search_path", () => {
    const sql = migration(HARDENING_MIGRATION);

    expect(sql).toMatch(
      /alter\s+function\s+public\.get_professional_trust_reputation\s*\(uuid\)\s+set\s+search_path\s*=\s*''\s*;/i,
    );
  });

  it("keeps every relation used by the RPC schema-qualified", () => {
    const sql = migration(SOURCE_MIGRATION);
    const functionStart = sql.indexOf(
      "CREATE OR REPLACE FUNCTION public.get_professional_trust_reputation",
    );
    expect(functionStart).toBeGreaterThanOrEqual(0);

    const tail = sql.slice(functionStart);
    const functionEnd = tail.indexOf("$func$;");
    const body = functionEnd >= 0 ? tail.slice(0, functionEnd) : tail;

    expect(body).toContain("FROM public.professional_data");
    expect(body).toContain("FROM public.work_opportunities");
    expect(body).toContain("LEFT JOIN public.trust_events");
    expect(body).not.toMatch(/\bFROM\s+(?!public\.|private\.|pg_catalog\.)[a-z_][a-z0-9_]*\b/i);
    expect(body).not.toMatch(/\bJOIN\s+(?!public\.|private\.|pg_catalog\.)[a-z_][a-z0-9_]*\b/i);
  });
});
