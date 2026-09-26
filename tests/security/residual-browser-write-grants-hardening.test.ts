import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260926021000_close_residual_browser_write_grants.sql",
  "utf8",
);

const subscriptionAuthority = readFileSync(
  "supabase/migrations/20260829183431_harden_user_subscription_server_write_authority.sql",
  "utf8",
);

const claimAuthority = readFileSync(
  "supabase/migrations/20260906082751_reconcile_business_claim_authority_g6.sql",
  "utf8",
);

describe("residual browser write grant hardening", () => {
  it("keeps commercial subscription mutations server-owned", () => {
    expect(subscriptionAuthority).toContain(
      "Commercial subscription state is server-owned",
    );
    expect(migration).toContain(
      "REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_subscriptions",
    );
    expect(migration).toContain("FROM PUBLIC, anon, authenticated;");
    expect(migration).toContain(
      "has_table_privilege('service_role', 'public.user_subscriptions', 'UPDATE')",
    );
  });

  it("removes only DELETE from the browser claim surface", () => {
    expect(claimAuthority).toContain(
      "CREATE POLICY business_claims_owner_insert",
    );
    expect(claimAuthority).toContain(
      "CREATE OR REPLACE FUNCTION public.admin_resolve_business_claim",
    );
    expect(claimAuthority).toContain(
      "GRANT EXECUTE ON FUNCTION public.admin_resolve_business_claim(uuid, uuid, text, text)\nTO service_role;",
    );

    expect(migration).toContain(
      "REVOKE DELETE ON TABLE public.business_claims",
    );
    expect(migration).toContain(
      "has_table_privilege('authenticated', 'public.business_claims', 'INSERT')",
    );
    expect(migration).toContain(
      "has_table_privilege('authenticated', 'public.business_claims', 'UPDATE')",
    );
  });

  it("does not alter policies, data, RLS state, function bodies, or ownership", () => {
    expect(migration).not.toMatch(/^\s*(?:CREATE|ALTER|DROP)\s+POLICY\b/im);
    expect(migration).not.toMatch(/^\s*(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM|TRUNCATE)\b/im);
    expect(migration).not.toMatch(
      /^\s*ALTER\s+TABLE\b.*\bDISABLE\s+ROW\s+LEVEL\s+SECURITY\b/im,
    );
    expect(migration).not.toMatch(/^\s*CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\b/im);
    expect(migration).not.toMatch(/^\s*ALTER\s+FUNCTION\b/im);
    expect(migration).not.toMatch(/^\s*GRANT\s+/im);
  });
});
