import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const schema = read(
  "supabase/migrations/20260715092000_create_community_direct_messaging_schema.sql",
);
const commands = read(
  "supabase/migrations/20260715093000_create_community_direct_messaging_commands.sql",
);
const service = read(
  "src/core/messaging/services/CommunityDirectMessagingService.ts",
);
const hook = read("src/core/community/hooks/useDirectMessages.ts");
const modal = read("src/core/community/components/DirectMessageModal.tsx");
const registry = read("src/core/realtime/config/realtimeRegistry.ts");

describe("Community Direct Messaging SSOT", () => {
  it("keeps Community, Classified, Ride and Group persistence separate", () => {
    expect(schema).toContain("public.community_direct_threads");
    expect(schema).toContain("public.community_direct_thread_participants");
    expect(schema).toContain("public.community_direct_messages");
    expect(schema).not.toContain("classified_id");
    expect(service).not.toContain("create_classified_conversation");
    expect(hook).not.toContain("classifiedMessagingService");
  });

  it("allows reads only to participants and exposes writes through RPCs", () => {
    expect(schema).toContain("ENABLE ROW LEVEL SECURITY");
    expect(schema).toContain(
      "private.auth_participates_community_direct_thread",
    );
    expect(schema).toContain(
      "REVOKE ALL ON TABLE public.community_direct_messages FROM PUBLIC, anon, authenticated",
    );
    expect(schema).toContain(
      "GRANT SELECT ON TABLE public.community_direct_messages TO authenticated",
    );
    expect(schema).not.toContain(
      "GRANT INSERT ON TABLE public.community_direct_messages TO authenticated",
    );
  });

  it("derives authorization from Profile ownership, membership and active Post link", () => {
    expect(commands).toContain("private.auth_owns_active_profile");
    expect(commands).toContain("public.community_memberships");
    expect(commands).toContain("membership.status = 'active'");
    expect(commands).toContain("public.community_entity_links");
    expect(commands).toContain("link.status = 'active'");
    expect(commands).toContain(
      "v_post_author_profile_id <> p_recipient_profile_id",
    );
    expect(commands).toContain("self_direct_message_not_allowed");
  });

  it("bounds inbox, history, creation, sending and reporting", () => {
    expect(commands.match(/p_limit > 51/g)?.length).toBe(2);
    expect(commands).toContain("(thread.last_message_at, thread.id)");
    expect(commands).toContain("(message.created_at, message.id)");
    expect(commands).toContain("community_direct_thread_rate_limit_exceeded");
    expect(commands).toContain("community_direct_message_rate_limit_exceeded");
    expect(commands).toContain("community_direct_report_rate_limit_exceeded");
  });

  it("keeps private text out of notification and audit metadata", () => {
    const sendFunction = commands.match(
      /CREATE OR REPLACE FUNCTION public\.send_community_direct_message[\s\S]*?REVOKE ALL ON FUNCTION public\.create_community_direct_thread/,
    )?.[0];
    expect(sendFunction).toBeDefined();
    expect(sendFunction).toContain(
      "v_actor_name || ' enviou uma mensagem privada'",
    );
    expect(sendFunction).not.toContain("'body', v_message.body");
    expect(schema).toContain(
      "Message and report text must never be copied here",
    );
  });

  it("uses the central Realtime registry and removes the fake location payload", () => {
    expect(registry).toContain('"messaging.community-thread-messages"');
    expect(registry).toContain('table: "community_direct_messages"');
    expect(service).toContain("subscribeToCommunityDirectMessages");
    expect(modal).not.toContain("GeolocationService");
    expect(modal).not.toContain("location_data");
  });
});
