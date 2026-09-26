import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260926011200_remove_redundant_service_role_rls_policies.sql",
  "utf8",
);

const redundantPolicies = [
  ["Sistema pode gerenciar audit log", "public.billing_audit_log"],
  ["Sistema pode gerenciar transações", "public.billing_transactions"],
  ["Service role can manage eligibility", "public.catalog_eligibility_rule"],
  ["Service role can manage entitlements", "public.catalog_entitlement_policy"],
  ["Service role can manage items", "public.catalog_item"],
  ["Service role can manage catalog", "public.commercial_catalog_version"],
  ["Sistema pode gerenciar email logs", "public.email_logs"],
  ["Service role can manage all verifications", "public.operational_verifications"],
  ["prof_slug_hist_svc", "public.professional_slug_history"],
  ["Sistema pode gerenciar webhooks", "public.stripe_webhook_events"],
] as const;

describe("service-role RLS scope hardening", () => {
  it("removes every redundant PUBLIC service-role policy", () => {
    for (const [policy, table] of redundantPolicies) {
      expect(migration).toContain(`DROP POLICY IF EXISTS \"${policy}\"`);
      expect(migration).toContain(`ON ${table};`);
    }
  });

  it("does not weaken browser authorization controls", () => {
    expect(migration).not.toMatch(/DISABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    expect(migration).not.toMatch(/GRANT\s+/i);
    expect(migration).not.toMatch(/CREATE\s+POLICY/i);
    expect(migration).not.toMatch(/ALTER\s+POLICY/i);
  });

  it("is transactionally bounded", () => {
    expect(migration).toMatch(/^--[\s\S]*\bBEGIN;/m);
    expect(migration).toMatch(/\bCOMMIT;\s*$/m);
  });
});
