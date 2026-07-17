import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd());

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("Trust operational command boundary", () => {
  const migration = readProjectFile(
    "supabase/migrations/20260715109000_consolidate_trust_commands.sql",
  );
  const rateLimitSchemaMigration = readProjectFile(
    "supabase/migrations/20260715111000_fix_trust_command_rate_limit.sql",
  );
  const rateLimitContractMigration = readProjectFile(
    "supabase/migrations/20260715112000_harden_trust_rate_limit_contract.sql",
  );
  const commandService = readProjectFile(
    "src/core/trust/services/OperationalTrustCommandService.ts",
  );
  const adminService = readProjectFile(
    "src/core/trust/services/TrustAdminService.ts",
  );
  const policyService = readProjectFile(
    "src/core/trust/services/TrustPolicyReadService.ts",
  );

  it("removes the generic browser CRUD service", () => {
    expect(
      existsSync(
        resolve(repoRoot, "src/core/trust/services/TrustEventService.ts"),
      ),
    ).toBe(false);
    expect(commandService).not.toContain("actor_profile_id");
    expect(commandService).not.toContain("actor_role");
    expect(commandService).not.toContain("evidence");
    expect(commandService).not.toContain('.from("trust_events")');
  });

  it("derives identities and domain context in bounded server commands", () => {
    expect(migration).toContain(
      "v_actor_profile_id UUID := private.current_active_profile_id()",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.submit_classified_trust_feedback",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.submit_order_trust_feedback",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.submit_ride_trust_feedback",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.submit_work_opportunity_feedback",
    );
    expect(migration).toContain("private.enforce_trust_feedback_rate_limit");
    expect(migration).toContain("ride_feedback_target_not_authorized");
  });

  it("keeps Trust tables private and exposes only RPC boundaries", () => {
    expect(migration).toContain(
      "REVOKE ALL ON TABLE public.trust_events FROM PUBLIC, anon, authenticated",
    );
    expect(migration).toContain(
      "REVOKE ALL ON TABLE public.trust_admin_actions FROM PUBLIC, anon, authenticated",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.submit_ride_trust_feedback",
    );
    expect(adminService).not.toContain('.from("trust_events")');
    expect(adminService).not.toContain('.from("trust_admin_actions")');
  });

  it("keeps review, rating and administrative effects atomic", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.submit_ride_rating",
    );
    expect(migration).toContain(
      "CREATE TRIGGER trg_sync_order_review_trust_event",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.apply_trust_admin_actions",
    );
    expect(migration).toContain("UPDATE public.profiles profile");
    expect(migration).toContain("INSERT INTO public.trust_admin_actions");
  });

  it("enforces policy in the database and exposes bounded read models", () => {
    expect(migration).toContain("CREATE TRIGGER trg_enforce_ride_trust_gate");
    expect(migration).toContain(
      "CREATE TRIGGER trg_enforce_order_courier_trust_gate",
    );
    expect(policyService).toContain('"get_current_trust_policy_decision"');
    expect(policyService).toContain('"get_ride_offer_trust_decisions"');
    expect(policyService).not.toContain('.from("trust_events")');
  });

  it("counts every Trust command even when feedback updates an existing event", () => {
    expect(rateLimitSchemaMigration).toContain(
      "CREATE TABLE IF NOT EXISTS private.trust_command_rate_limits",
    );
    expect(rateLimitSchemaMigration).toContain(
      "PRIMARY KEY (actor_profile_id, command_name)",
    );
    expect(rateLimitContractMigration).toContain(
      "ON CONFLICT (actor_profile_id, command_name)",
    );
    expect(rateLimitContractMigration).toContain(
      "ELSE rate_limit.request_count + 1",
    );
    expect(rateLimitSchemaMigration).toContain(
      "REFERENCES public.profiles(id) ON DELETE CASCADE",
    );
    expect(rateLimitContractMigration).toContain("OR p_command IS NULL");
    expect(rateLimitContractMigration).toContain("OR p_max_events IS NULL");
    expect(rateLimitContractMigration).not.toContain(
      "FROM public.trust_events",
    );
  });
});
