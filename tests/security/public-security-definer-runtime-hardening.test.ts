import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260926013000_harden_public_security_definer_rpc_runtime.sql",
  "utf8",
);

describe("public SECURITY DEFINER runtime hardening", () => {
  it("bounds both public read RPCs to three seconds", () => {
    expect(migration).toMatch(
      /ALTER FUNCTION public\.get_community_poll_for_post\(uuid\)[\s\S]*?SET statement_timeout = '3s';/,
    );
    expect(migration).toMatch(
      /ALTER FUNCTION public\.profile_public_territory_projection\(uuid\)[\s\S]*?SET statement_timeout = '3s';/,
    );
  });

  it("removes unnecessary search_path resolution from territory projection", () => {
    expect(migration).toMatch(
      /ALTER FUNCTION public\.profile_public_territory_projection\(uuid\)[\s\S]*?SET search_path = '';/,
    );
  });

  it("does not change authorization, grants, ownership, or function bodies", () => {
    expect(migration).not.toMatch(/^\s*(?:GRANT|REVOKE)\s+/im);
    expect(migration).not.toMatch(/^\s*ALTER\s+FUNCTION\b.*\bOWNER\s+TO\b/im);
    expect(migration).not.toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION/i);
    expect(migration).not.toMatch(/SECURITY\s+(?:DEFINER|INVOKER)/i);
  });
});
