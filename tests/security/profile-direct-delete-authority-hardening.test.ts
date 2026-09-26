import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260926020500_close_direct_profile_delete_authority.sql",
  "utf8",
);

const deletionAuthority = readFileSync(
  "supabase/migrations/20260826015916_reconcile_account_deletion_authority_live_drift.sql",
  "utf8",
);

describe("profile direct-delete authority hardening", () => {
  it("removes browser DELETE while preserving the server-owned authority", () => {
    expect(migration).toContain(
      "REVOKE DELETE ON TABLE public.profiles FROM PUBLIC, anon, authenticated;",
    );
    expect(migration).toContain(
      'DROP POLICY "Only account owner can delete profiles" ON public.profiles;',
    );
    expect(migration).toContain("'Perfis não podem ser deletados'");
    expect(migration).toContain(
      "has_table_privilege('service_role', 'public.profiles', 'DELETE')",
    );

    expect(migration).not.toMatch(
      /^\s*GRANT\s+DELETE\s+ON\s+(?:TABLE\s+)?public\.profiles\s+TO\s+(?:PUBLIC|anon|authenticated)\b/im,
    );
    expect(migration).not.toMatch(/^\s*DELETE\s+FROM\s+public\.profiles\b/im);
    expect(migration).not.toMatch(/^\s*TRUNCATE\s+(?:TABLE\s+)?public\.profiles\b/im);
    expect(migration).not.toMatch(/^\s*ALTER\s+TABLE\s+public\.profiles\s+DISABLE\s+ROW\s+LEVEL\s+SECURITY\b/im);
  });

  it("keeps account deletion behind service-role brokers", () => {
    expect(deletionAuthority).toContain(
      "REVOKE ALL ON TABLE public.account_deletion_requests FROM authenticated;",
    );
    expect(deletionAuthority).toContain(
      "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.account_deletion_requests TO service_role;",
    );
    expect(deletionAuthority).toContain(
      "GRANT EXECUTE ON FUNCTION public.request_account_deletion_for_user(UUID, TEXT, BOOLEAN) TO service_role;",
    );
    expect(deletionAuthority).toContain("v_now + INTERVAL '30 days'");
  });
});
