import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260926014500_harden_authenticated_security_definer_rpc_timeouts.sql",
  "utf8",
);

const expectedTimeouts = new Map<string, string>([
  ["current_user_has_password()", "2s"],
  ["get_current_notification_preferences()", "2s"],
  ["is_current_user_business_favorite(uuid)", "2s"],
  ["block_classified_conversation(uuid, text)", "3s"],
  ["cast_community_poll_vote(uuid, uuid, uuid)", "3s"],
  ["create_classified_conversation(uuid)", "3s"],
  ["get_current_user_business_favorite_ids(uuid[])", "3s"],
  ["get_current_user_business_favorites(integer, integer, text[])", "3s"],
  ["list_group_message_reaction_state(uuid[])", "3s"],
  ["mark_classified_messages_read(uuid)", "3s"],
  ["moderate_classified_conversation(uuid, text, text)", "3s"],
  [
    "patch_current_notification_preferences(boolean, boolean, boolean, boolean, boolean, boolean, text, boolean, time without time zone, time without time zone, integer[])",
    "3s",
  ],
  [
    "patch_current_user_business_favorite(uuid, boolean, boolean, boolean, text, boolean, text[])",
    "3s",
  ],
  ["report_classified_comment(uuid, uuid, text, text)", "3s"],
  ["report_classified_conversation(uuid, text, text)", "3s"],
  ["report_classified_message(uuid, text, text)", "3s"],
  ["request_profile_verification(uuid, text, text, text, text)", "3s"],
  ["send_classified_message(uuid, text)", "3s"],
  ["set_current_user_business_favorite(uuid, boolean)", "3s"],
  ["toggle_group_message_like(uuid)", "3s"],
  ["create_post_with_poll(jsonb)", "5s"],
  ["get_community_rpc_operational_metrics(integer)", "5s"],
  ["get_community_rpc_slo_status(integer, integer, numeric, integer)", "5s"],
]);

function compactSql(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

describe("authenticated SECURITY DEFINER runtime hardening", () => {
  it("bounds exactly the reviewed 23 RPC signatures", () => {
    const compact = compactSql(migration);
    const alteredFunctions = compact.match(/ALTER FUNCTION public\./g) ?? [];
    const timeoutSettings = compact.match(/SET statement_timeout = '[235]s';/g) ?? [];

    expect(alteredFunctions).toHaveLength(expectedTimeouts.size);
    expect(timeoutSettings).toHaveLength(expectedTimeouts.size);

    for (const [signature, timeout] of expectedTimeouts) {
      expect(compact).toContain(
        `ALTER FUNCTION public.${signature} SET statement_timeout = '${timeout}';`,
      );
    }
  });

  it("does not change authorization, ownership, body, or search_path", () => {
    expect(migration).not.toMatch(/^\s*(?:GRANT|REVOKE)\s+/im);
    expect(migration).not.toMatch(/^\s*ALTER\s+FUNCTION\b.*\bOWNER\s+TO\b/im);
    expect(migration).not.toMatch(/^\s*CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\b/im);
    expect(migration).not.toMatch(/^\s*SECURITY\s+(?:DEFINER|INVOKER)\b/im);
    expect(migration).not.toMatch(/^\s*SET\s+search_path\b/im);
    expect(migration).not.toMatch(/^\s*DROP\s+FUNCTION\b/im);
  });
});
