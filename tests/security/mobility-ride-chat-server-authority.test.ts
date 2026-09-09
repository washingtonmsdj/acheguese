import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const migration = read(
  "supabase/migrations/20260909152243_create_server_owned_ride_chat_g7.sql",
);
const mutations = read("src/core/mobility/services/chat.mutations.ts");
const rideChatHook = read("src/core/mobility/hooks/useRideChat.ts");
const rideReads = read(
  "src/core/mobility/services/mobility.ride-read-queries.ts",
);
const chatList = read(
  "src/modules/mobility/components/chat/MobilityChatList.tsx",
);
const realtimeRegistry = read(
  "src/core/realtime/config/realtimeRegistry.ts",
);

describe("Mobility ride chat server authority", () => {
  it("keeps ride chat storage participant-readable and browser-write closed", () => {
    expect(migration).toContain("CREATE TABLE public.ride_chats");
    expect(migration).toContain("CREATE TABLE public.ride_chat_messages");
    expect(migration).toContain(
      "ALTER TABLE public.ride_chat_messages ENABLE ROW LEVEL SECURITY",
    );
    expect(migration).toContain(
      "REVOKE ALL PRIVILEGES ON TABLE public.ride_chat_messages FROM PUBLIC, anon, authenticated",
    );
    expect(migration).toContain(
      "GRANT SELECT ON TABLE public.ride_chat_messages TO authenticated",
    );
    expect(migration).toContain("ride_chat_messages_select_participant");
    expect(migration).toContain("private.current_active_profile_id()");
  });

  it("derives sender and read-receipt actor on the server", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.send_ride_chat_message",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.mark_ride_chat_messages_read",
    );
    expect(migration).toContain("v_actor_profile_id uuid := private.current_active_profile_id()");
    expect(migration).toContain("ride_chat_participant_required");
    expect(migration).toContain("char_length(v_text) > 2000");

    expect(mutations).toContain('"send_ride_chat_message"');
    expect(mutations).toContain('"mark_ride_chat_messages_read"');
    expect(mutations).toContain('"ensure_ride_chat"');
    expect(mutations).not.toContain('.from("ride_chat_messages")');
    expect(mutations).not.toContain("sender_profile_id: input");
  });

  it("uses one realtime SSOT and deduplicates delivery echoes", () => {
    expect(realtimeRegistry).toContain('"mobility.ride-chat-messages"');
    expect(realtimeRegistry).toContain('table: "ride_chat_messages"');
    expect(migration).toContain(
      "ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_chat_messages",
    );
    expect(rideChatHook).toContain("ChatService.subscribeToMessages");
    expect(rideChatHook).toContain("mergeMessages");
    expect(rideChatHook).not.toContain("userId");
    expect(rideChatHook).not.toContain("sender_profile_id:");
  });

  it("removes the parallel nonexistent mobility chat store and inbox N+1", () => {
    expect(rideReads).toContain('"list_ride_chat_summaries"');
    expect(rideReads).not.toContain('"mobility_conversations"');
    expect(rideReads).not.toContain('"mobility_messages"');

    expect(chatList).not.toContain("getLastMessage");
    expect(chatList).not.toContain("getUnreadCount");
    expect(chatList).not.toContain("getRideBasicInfo");
    expect(chatList).toContain("rideId={selectedRideId}");
    expect(chatList).toContain("c.ride_id === selectedRideId");
  });
});
