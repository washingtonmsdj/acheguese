import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("internal RPC grant security", () => {
  it("removes authenticated execute from trigger-only and unused privileged RPCs", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260707133656_revoke_authenticated_from_internal_trigger_and_unused_rpcs.sql",
    );

    for (const functionName of [
      "audit_education_lead_status_change",
      "can_use_premium_link",
      "check_suspension_expiry",
      "generate_unique_handle",
      "get_pending_webhooks",
      "initialize_notification_preferences",
      "initialize_user_mfa_status",
      "trigger_start_dispatch",
      "validate_profile_link_same_account",
    ]) {
      expect(migration).toContain(`'${functionName}'`);
    }

    expect(migration).toContain("pg_get_function_identity_arguments(p.oid)");
    expect(migration).toContain("REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role");
    expect(migration).not.toContain("'update_session_activity'");
  });

  it("removes authenticated execute from unused privileged RPCs with no DB dependency", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260707134401_revoke_authenticated_from_unused_no_dependency_rpcs.sql",
    );

    for (const functionName of [
      "create_business_data_with_canonical",
      "create_professional_data_with_canonical",
      "create_ride_request_with_canonical",
      "create_user_residence_with_canonical",
      "detect_impossible_travel",
      "get_active_sessions_count",
      "get_business_recommendations_count",
      "get_conversion_funnel",
      "get_daily_events",
      "get_driver_weekly_earnings",
      "get_event_statistics",
      "get_logs_statistics",
      "get_qr_code_analytics",
      "get_user_favorite_businesses",
      "get_user_journey",
      "has_consent",
      "is_in_quiet_hours",
      "reserve_route",
      "search_logs",
      "toggle_comment_like",
      "update_user_residence_with_canonical",
    ]) {
      expect(migration).toContain(`'${functionName}'`);
    }

    expect(migration).toContain("pg_get_function_identity_arguments(p.oid)");
    expect(migration).toContain("REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role");
    expect(migration).not.toContain("'update_session_activity'");
    expect(migration).not.toContain("'can_manage_profile'");
    expect(migration).not.toContain("'is_admin_from_roles'");
  });

  it("removes authenticated execute from helper RPCs called only by privileged routines", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260707134629_revoke_authenticated_from_internal_helper_rpcs.sql",
    );

    for (const functionName of [
      "admin_notifications_assert_access",
      "auth_has_verified_residence_at_location",
      "find_eligible_drivers",
      "resolve_delivery_order_actor_role",
    ]) {
      expect(migration).toContain(`'${functionName}'`);
    }

    expect(migration).toContain("pg_get_function_identity_arguments(p.oid)");
    expect(migration).toContain("REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role");
    expect(migration).not.toContain("'communication_current_user_can_manage_channel'");
    expect(migration).not.toContain("'can_manage_profile'");
    expect(migration).not.toContain("'is_admin_from_roles'");
  });
});
