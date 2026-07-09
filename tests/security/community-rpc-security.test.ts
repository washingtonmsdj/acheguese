import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("community content rpc broker security", () => {
  it("routes privileged community content mutations through an authenticated broker", () => {
    const edgeFunction = readProjectFile("supabase/functions/community-rpc/index.ts");
    const eventEdgeFunction = readProjectFile("supabase/functions/event-rpc/index.ts");
    const config = readProjectFile("supabase/config.toml");
    const broker = readProjectFile("src/core/community/services/CommunityRpcService.ts");
    const eventService = readProjectFile(
      "src/core/verticals/events/services/EventMutationService.ts",
    );
    const alertService = readProjectFile(
      "src/core/community/alerts/services/CommunityAlertService.ts",
    );
    const issueService = readProjectFile(
      "src/core/community/issues/services/CommunityIssueService.ts",
    );
    const qaService = readProjectFile("src/core/community/services/CommunityQAService.ts");

    expect(config).toContain("[functions.community-rpc]");
    expect(config).toMatch(/\[functions\.community-rpc\]\s+verify_jwt = true/);
    expect(config).toContain("[functions.event-rpc]");
    expect(config).toMatch(/\[functions\.event-rpc\]\s+verify_jwt = true/);

    expect(edgeFunction).toContain("function requireUser(");
    expect(edgeFunction).toContain('getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("create_community_alert"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("create_community_issue"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("increment_alert_edit_count"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("mark_best_answer"');
    expect(edgeFunction).not.toContain('supabaseAdmin.rpc("increment_event_participants"');
    expect(edgeFunction).not.toContain('supabaseAdmin.rpc("decrement_event_participants"');
    expect(edgeFunction).toContain("withTrustedActor");
    expect(edgeFunction).toContain("profileBelongsToUser");
    expect(edgeFunction).not.toContain("participantExists");
    expect(edgeFunction).not.toMatch(/_actor_user_id:\s*params\./);
    expect(edgeFunction).not.toMatch(/user_id:\s*params\./);

    expect(eventEdgeFunction).toContain("function requireUser(");
    expect(eventEdgeFunction).toContain('getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")');
    expect(eventEdgeFunction).toContain('supabaseAdmin.rpc("join_event_participation"');
    expect(eventEdgeFunction).toContain('supabaseAdmin.rpc("leave_event_participation"');
    expect(eventEdgeFunction).toContain('supabaseAdmin.rpc("check_in_event_participation"');
    expect(eventEdgeFunction).toContain('supabaseAdmin.rpc("check_in_event_participation_by_code"');
    expect(eventEdgeFunction).toContain("p_actor_user_id: auth.userId");
    expect(eventEdgeFunction).toContain("p_is_project_admin: auth.isProjectAdmin");

    expect(broker).toContain('const FUNCTION_NAME = "community-rpc"');
    expect(alertService).toContain("CommunityRpcService.createAlert");
    expect(alertService).toContain("CommunityRpcService.incrementAlertEditCount");
    expect(issueService).toContain("CommunityRpcService.createIssue");
    expect(qaService).toContain("CommunityRpcService.markBestAnswer");
    expect(eventService).toContain('const EVENT_RPC_FUNCTION_NAME = "event-rpc"');
    expect(eventService).toContain('"joinEvent"');
    expect(eventService).toContain('"leaveEvent"');
    expect(eventService).toContain('"checkInEvent"');
    expect(eventService).toContain('"checkInEventByCode"');
    expect(eventService).not.toContain("CommunityRpcService");

    for (const source of [alertService, issueService, qaService, eventService]) {
      expect(source).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']create_community_alert/);
      expect(source).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']create_community_issue/);
      expect(source).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']increment_alert_edit_count/);
      expect(source).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']mark_best_answer/);
      expect(source).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']increment_event_participants/);
      expect(source).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']decrement_event_participants/);
    }
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

    expect(migration).toContain("REVOKE ALL ON FUNCTION public.increment_event_participants(uuid)");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.decrement_event_participants(uuid)");
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
