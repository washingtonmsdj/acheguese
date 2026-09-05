import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("community content rpc broker security", () => {
  it("limits the service-role broker to alert creation and keeps other writes in their hardened database contracts", () => {
    const edgeFunction = readProjectFile(
      "supabase/functions/community-rpc/index.ts",
    );
    const eventEdgeFunction = readProjectFile(
      "supabase/functions/event-rpc/index.ts",
    );
    const config = readProjectFile("supabase/config.toml");
    const broker = readProjectFile(
      "src/core/community/services/CommunityRpcService.ts",
    );
    const eventService = readProjectFile(
      "src/core/community-events/services/EventMutationService.ts",
    );
    const alertService = readProjectFile(
      "src/core/community/alerts/services/CommunityAlertService.ts",
    );
    const issueService = readProjectFile(
      "src/core/community-issues/services/CommunityIssueService.ts",
    );
    const qaService = readProjectFile(
      "src/core/community-recommendations/services/CommunityQAService.ts",
    );

    expect(config).toContain("[functions.community-rpc]");
    expect(config).toMatch(/\[functions\.community-rpc\]\s+verify_jwt = true/);
    expect(config).toContain("[functions.event-rpc]");
    expect(config).toMatch(/\[functions\.event-rpc\]\s+verify_jwt = true/);

    expect(edgeFunction).toContain("function requireUser(");
    expect(edgeFunction).toContain(
      'getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")',
    );
    expect(edgeFunction).toContain(
      'supabaseAdmin.rpc("create_community_alert"',
    );
    expect(edgeFunction).not.toContain(
      'supabaseAdmin.rpc("create_community_issue"',
    );
    expect(edgeFunction).not.toContain(
      'supabaseAdmin.rpc("increment_alert_edit_count"',
    );
    expect(edgeFunction).not.toContain('supabaseAdmin.rpc("mark_best_answer"');
    expect(edgeFunction).not.toContain(
      'supabaseAdmin.rpc("increment_event_participants"',
    );
    expect(edgeFunction).not.toContain(
      'supabaseAdmin.rpc("decrement_event_participants"',
    );
    expect(edgeFunction).toContain("withTrustedActor");
    expect(edgeFunction).not.toMatch(/_actor_user_id:\s*params\./);
    expect(edgeFunction).not.toMatch(/user_id:\s*params\./);

    expect(eventEdgeFunction).toContain("function requireUser(");
    expect(eventEdgeFunction).toContain(
      'getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")',
    );
    expect(eventEdgeFunction).toContain(
      'supabaseAdmin.rpc("join_event_participation"',
    );
    expect(eventEdgeFunction).toContain(
      'supabaseAdmin.rpc("leave_event_participation"',
    );
    expect(eventEdgeFunction).toContain(
      'supabaseAdmin.rpc("check_in_event_participation"',
    );
    expect(eventEdgeFunction).toContain(
      'supabaseAdmin.rpc("check_in_event_participation_by_code"',
    );
    expect(eventEdgeFunction).toContain("p_actor_user_id: auth.userId");
    expect(eventEdgeFunction).toContain(
      "p_is_project_admin: auth.isProjectAdmin",
    );

    expect(broker).toContain('const FUNCTION_NAME = "community-rpc"');
    expect(alertService).toContain("CommunityRpcService.createAlert");
    expect(broker).not.toContain("incrementAlertEditCount");
    expect(broker).not.toContain("createIssue");
    expect(broker).not.toContain("markBestAnswer");
    expect(issueService).toContain('supabase.rpc("create_community_issue"');
    expect(qaService).toContain('supabase.rpc("mark_best_answer"');
    expect(eventService).toContain(
      'const EVENT_RPC_FUNCTION_NAME = "event-rpc"',
    );
    expect(eventService).toContain('"joinEvent"');
    expect(eventService).toContain('"leaveEvent"');
    expect(eventService).toContain('"checkInEvent"');
    expect(eventService).toContain('"checkInEventByCode"');
    expect(eventService).not.toContain("CommunityRpcService");

    expect(alertService).not.toMatch(
      /rpc(?:<[^>]+>)?\(\s*["']create_community_alert/,
    );
    expect(eventService).not.toMatch(
      /rpc(?:<[^>]+>)?\(\s*["']increment_event_participants/,
    );
    expect(eventService).not.toMatch(
      /rpc(?:<[^>]+>)?\(\s*["']decrement_event_participants/,
    );
  });

  it("revokes direct browser execution of backing community RPCs", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260707225829_route_community_content_rpcs_through_edge_function.sql",
    );

    for (const signature of [
      "public.create_community_alert(jsonb)",
      "public.create_community_alert(text, text, text, uuid)",
      "public.create_community_alert(text, text, text, uuid, numeric, numeric, text)",
      "public.create_community_issue(jsonb)",
      "public.increment_alert_edit_count(uuid)",
      "public.mark_best_answer(uuid, uuid)",
    ]) {
      expect(migration).toContain(`REVOKE ALL ON FUNCTION ${signature}`);
      expect(migration).toContain("FROM PUBLIC, anon, authenticated");
      expect(migration).toContain(`GRANT EXECUTE ON FUNCTION ${signature}`);
      expect(migration).toContain("TO service_role");
    }

    expect(migration).toContain("payload->>'_actor_user_id'");
    expect(migration).toContain("ur.user_id = v_user_id");
    expect(migration).toContain("verified_residence_required");
  });

  it("uses a fail-closed distributed limiter and admin-only latency metrics", () => {
    const edgeFunction = readProjectFile(
      "supabase/functions/community-rpc/index.ts",
    );
    const migration = readProjectFile(
      "supabase/migrations/20260714090000_add_community_rpc_scale_controls.sql",
    );
    const retentionMigration = readProjectFile(
      "supabase/migrations/20260714093000_add_community_rpc_audit_retention.sql",
    );
    const loadHarness = readProjectFile(
      "tools/release/community-staging-load-test.mjs",
    );

    expect(edgeFunction).toMatch(
      /supabaseAdmin\.rpc\(\s*"consume_community_edge_rate_limit"/,
    );
    expect(edgeFunction).toContain('outcome: "blocked_fail_closed"');
    expect(edgeFunction).toContain("statusCode: 503");
    expect(edgeFunction).toContain("duration_ms: durationMs");
    expect(edgeFunction).toContain('"X-Request-ID": requestId');
    expect(edgeFunction).toContain(
      "withRequestId(rawBody.response, requestId)",
    );

    expect(migration).toContain(
      "CREATE TABLE IF NOT EXISTS private.community_edge_rate_limits",
    );
    expect(migration).toContain(
      "ON CONFLICT (function_name, actor_user_id, action) DO UPDATE",
    );
    expect(migration).toContain("COALESCE(auth.role(), '') <> 'service_role'");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("TO service_role");
    expect(migration).toContain("percentile_cont(0.95)");
    expect(migration).toContain("private.is_admin_user(auth.uid())");
    expect(migration).toContain("error_rate_threshold_exceeded");

    expect(retentionMigration).toContain(
      "private.prune_community_rpc_function_audit",
    );
    expect(retentionMigration).toContain("now() - INTERVAL '90 days'");
    expect(retentionMigration).toContain("FOR UPDATE SKIP LOCKED");
    expect(retentionMigration).toContain("TO service_role");
    expect(retentionMigration).toContain("FROM PUBLIC, anon, authenticated");
    expect(retentionMigration).toContain(
      "acheguese-community-rpc-audit-retention",
    );

    expect(loadHarness).toContain("COMMUNITY_LOAD_CONFIRM");
    expect(loadHarness).toContain("STAGING_ONLY_CONFIRMED");
    expect(loadHarness).toContain('target.pathname.startsWith("/rest/v1/")');
    expect(loadHarness).toContain('method: "GET"');
  });

  it("revokes direct browser execution of atomic event participation RPCs", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260709005208_atomic_event_participation_rpcs.sql",
    );
    const legacyDropMigration = readProjectFile(
      "supabase/migrations/20260709011223_drop_legacy_event_counter_rpcs.sql",
    );

    for (const signature of [
      "public.join_event_participation(uuid, uuid, uuid, boolean)",
      "public.leave_event_participation(uuid, uuid, uuid, boolean)",
      "public.check_in_event_participation(uuid, uuid, uuid, boolean)",
      "public.check_in_event_participation_by_code(uuid, uuid, uuid, boolean)",
    ]) {
      expect(migration).toContain(`REVOKE ALL ON FUNCTION ${signature}`);
      expect(migration).toContain("FROM PUBLIC, anon, authenticated");
      expect(migration).toContain(`GRANT EXECUTE ON FUNCTION ${signature}`);
      expect(migration).toContain("TO service_role");
    }

    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.increment_event_participants(uuid)",
    );
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.decrement_event_participants(uuid)",
    );
    expect(migration).toContain("FROM service_role");
    expect(legacyDropMigration).toContain(
      "DROP FUNCTION IF EXISTS public.increment_event_participants(uuid)",
    );
    expect(legacyDropMigration).toContain(
      "DROP FUNCTION IF EXISTS public.decrement_event_participants(uuid)",
    );
    expect(migration).toContain("not_authorized_for_event_profile");
    expect(migration).toContain("not_authorized_for_event_checkin");
  });
});
