import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = readFileSync(
  resolve(
    root,
    "supabase/migrations/20260915135002_add_current_user_password_authority.sql",
  ),
  "utf8",
);

describe("current-user password capability authority", () => {
  it("returns only an actor-bound boolean over the authenticated Auth user", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.current_user_has_password()",
    );
    expect(migration).toContain("RETURNS boolean");
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = pg_catalog, auth");
    expect(migration).toContain("auth.uid() IS NOT NULL");
    expect(migration).toContain("users.id = auth.uid()");
    expect(migration).toContain("NULLIF(users.encrypted_password, '') IS NOT NULL");
    expect(migration).not.toContain("p_user_id");
  });

  it("keeps the RPC unavailable to anonymous callers", () => {
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.current_user_has_password()\n  FROM PUBLIC, anon;",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.current_user_has_password()\n  TO authenticated;",
    );
  });
});
