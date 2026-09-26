import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260926013500_cleanup_profile_rls_redundancy.sql",
  ),
  "utf8",
);

describe("profile RLS redundancy cleanup", () => {
  it("removes only the two obsolete permissive policies", () => {
    expect(sql).toContain('DROP POLICY IF EXISTS "Perfis não podem ser deletados"');
    expect(sql).toContain('DROP POLICY IF EXISTS "Usuários atualizam seus próprios perfis"');
    expect(sql).not.toMatch(/drop\s+policy[\s\S]*Admins can view all profiles/i);
    expect(sql).not.toMatch(/drop\s+policy[\s\S]*Public can view active public profiles/i);
    expect(sql).not.toMatch(/drop\s+policy[\s\S]*Users can view own profiles/i);
  });

  it("requires canonical owner policies before cleanup", () => {
    expect(sql).toContain("Only account owner can delete profiles");
    expect(sql).toContain("Account owners can update their profiles");
    expect(sql).toContain("roles = ARRAY['authenticated']::name[]");
  });

  it("requires the server-owned field trigger to remain enabled", () => {
    expect(sql).toContain("trg_guard_profile_server_owned_fields");
    expect(sql).toContain("tgenabled <> 'D'");
  });

  it("does not recreate or broaden any authorization predicate", () => {
    expect(sql).not.toMatch(/create\s+policy/i);
    expect(sql).not.toMatch(/alter\s+policy/i);
    expect(sql).not.toMatch(/grant\s+/i);
  });

  it("verifies obsolete policies are gone and canonical policies remain", () => {
    expect(sql).toContain("obsolete profile policies still present after cleanup");
    expect(sql).toContain("canonical profile owner policies were not preserved");
  });
});
