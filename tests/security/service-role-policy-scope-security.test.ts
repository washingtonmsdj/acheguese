import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260926012600_scope_service_role_policies.sql",
  ),
  "utf8",
);

const policies = [
  ["billing_audit_log", "Sistema pode gerenciar audit log"],
  ["billing_transactions", "Sistema pode gerenciar transações"],
  ["catalog_eligibility_rule", "Service role can manage eligibility"],
  ["catalog_entitlement_policy", "Service role can manage entitlements"],
  ["catalog_item", "Service role can manage items"],
  ["commercial_catalog_version", "Service role can manage catalog"],
  ["email_logs", "Sistema pode gerenciar email logs"],
  ["operational_verifications", "Service role can manage all verifications"],
  ["professional_slug_history", "prof_slug_hist_svc"],
  ["stripe_webhook_events", "Sistema pode gerenciar webhooks"],
] as const;

describe("service-role RLS policy scope", () => {
  it("moves each legacy system policy from PUBLIC to service_role only", () => {
    for (const [table, policy] of policies) {
      const escapedPolicy = policy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const escapedTable = table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      expect(sql).toMatch(
        new RegExp(
          `alter\\s+policy\\s+"${escapedPolicy}"\\s+on\\s+public\\.${escapedTable}\\s+to\\s+service_role`,
          "i",
        ),
      );
    }
  });

  it("does not recreate, broaden, or weaken policy predicates", () => {
    expect(sql).not.toMatch(/create\s+policy/i);
    expect(sql).not.toMatch(/\busing\s*\(/i);
    expect(sql).not.toMatch(/\bwith\s+check\s*\(/i);
    expect(sql).not.toMatch(/\bto\s+(?:public|anon|authenticated)\b/i);
  });

  it("verifies the live role array before committing", () => {
    expect(sql).toContain("p.roles <> ARRAY['service_role']::name[]");
    expect(sql).toContain("service-role policy scoping verification failed");
  });
});
