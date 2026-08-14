import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const migration = read(
  "supabase/migrations/20260715090000_create_classified_messaging_inbox_read_model.sql",
);
const indexes = read(
  "supabase/migrations/20260715091000_optimize_classified_messaging_inbox_indexes.sql",
);
const service = read(
  "src/core/messaging/services/ClassifiedMessagingService.ts",
);
const inboxHook = read("src/core/messaging/hooks/useMensagens.ts");
const publicApi = read("src/core/messaging/index.ts");

describe("Classified Messaging SSOT", () => {
  it("names the aggregate owner explicitly and exposes no generic legacy alias", () => {
    expect(publicApi).toContain("ClassifiedMessagingService");
    expect(publicApi).toContain("classifiedMessagingService");
    expect(publicApi).not.toMatch(/\bmessagingService\b/);
    expect(service).not.toContain("class MessagingService");
  });

  it("keeps identity and bounded input enforcement in the server-owned read model", () => {
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("auth.uid() IS NULL");
    expect(migration).toContain(
      "private.auth_owns_active_profile(p_profile_id)",
    );
    expect(migration).toContain("p_limit > 51");
    expect(migration).toContain("char_length(v_search) > 100");
    expect(migration).toContain("REVOKE ALL ON FUNCTION");
    expect(migration).toContain("FROM PUBLIC, anon");
    expect(migration).toContain("TO authenticated");
  });

  it("uses paired keyset pagination with deterministic supporting indexes", () => {
    expect(migration).toContain(
      "(p_cursor_last_message_at IS NULL) <> (p_cursor_id IS NULL)",
    );
    expect(migration).toContain(
      "(conversation.last_message_at, conversation.id)",
    );
    expect(migration).toContain(
      "ORDER BY conversation.last_message_at DESC, conversation.id DESC",
    );
    expect(indexes).toContain("(buyer_id, last_message_at DESC, id DESC)");
    expect(indexes).toContain("(seller_id, last_message_at DESC, id DESC)");
  });

  it("eliminates the per-conversation inbox N+1 and paginates from the UI", () => {
    expect(service).toMatch(/rpc\(\s*"list_classified_conversation_previews"/);
    expect(service).not.toContain("getLastMessage");
    expect(service).not.toContain("getUnreadCount");
    expect(service).not.toContain("getClassifiedsByIds");
    expect(service).not.toContain("getTotalUnreadCount");
    expect(inboxHook).toContain("useInfiniteQuery");
    expect(inboxHook).toContain("getNextPageParam");
    expect(inboxHook).toContain("fetchNextPage");
  });
});
