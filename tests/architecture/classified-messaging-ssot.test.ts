import { existsSync, readFileSync } from "node:fs";
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
const publicApi = read("src/core/messaging/index.ts");
const providerScope = read("src/app/config/messagingProviderScope.ts");
const providerRegistry = read(
  "src/core/messaging/providers/messagingProviderRegistry.ts",
);
const detailPage = read(
  "src/modules/classifieds/pages/ClassificadoDetailPage.tsx",
);
const sellerContactBar = read(
  "src/modules/classifieds/components/profile/VendedorContactBar.tsx",
);
const sellerPage = read(
  "src/modules/classifieds/pages/VendedorPerfilPage.tsx",
);
const shortRoute = read(
  "src/app/routes/classifieds/ClassifiedShortRoute.tsx",
);
const canonicalRoute = read(
  "src/app/routes/classifieds/ClassifiedCanonicalRoute.tsx",
);

describe("Classified Messaging SSOT", () => {
  it("names the aggregate owner explicitly and exposes no generic legacy alias", () => {
    expect(publicApi).toContain("ClassifiedMessagingService");
    expect(publicApi).toContain("classifiedMessagingService");
    expect(publicApi).not.toMatch(/\bmessagingService\b/);
    expect(service).not.toContain("class MessagingService");
  });

  it("keeps presentation surfaces out of the core messaging owner", () => {
    for (const directory of ["components", "hooks", "pages"]) {
      expect(existsSync(resolve(root, `src/core/messaging/${directory}`))).toBe(false);
    }
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

  it("eliminates the per-conversation inbox N+1 behind the canonical core service", () => {
    expect(service).toMatch(/rpc\(\s*"list_classified_conversation_previews"/);
    expect(service).not.toContain("getLastMessage");
    expect(service).not.toContain("getUnreadCount");
    expect(service).not.toContain("getClassifiedsByIds");
    expect(service).not.toContain("getTotalUnreadCount");
  });

  it("keeps classified messaging lifecycle in the app composition root", () => {
    for (const source of [detailPage, sellerContactBar, sellerPage]) {
      expect(source).not.toContain("@/app/config/launchScope");
      expect(source).not.toContain("communityCommunication");
    }

    expect(detailPage).toContain("internalMessagingEnabled = false");
    expect(detailPage).toContain("const showInternalChat = internalMessagingEnabled");
    expect(sellerContactBar).toContain("internalMessagingEnabled = false");
    expect(sellerContactBar).toContain("const showInternalChat = internalMessagingEnabled");
    expect(sellerPage).toContain(
      "internalMessagingEnabled={internalMessagingEnabled}",
    );

    for (const route of [shortRoute, canonicalRoute]) {
      expect(route).toContain("getActiveMessagingProviderIds");
      expect(route).toContain('.includes("classifieds")');
      expect(route).toContain(
        "internalMessagingEnabled={internalMessagingEnabled}",
      );
    }

    expect(providerScope).toContain("classifieds: \"classifieds\"");
    expect(providerScope).toContain("getMessagingProvider(providerId) !== null");
    expect(providerRegistry).not.toContain("classifiedsMessagingProvider");
  });

  it("uses the canonical provider-scoped thread route with no legacy chat path", () => {
    expect(detailPage).toContain(
      'messagingRoutes.thread("classifieds", conversation.id)',
    );
    expect(detailPage).not.toContain('/chat/${conversation.id}');
    expect(sellerContactBar).toContain(
      'messagingRoutes.thread("classifieds", conversation.id)',
    );
  });

  it("does not keep the callerless fake classified stats component", () => {
    expect(
      existsSync(
        resolve(root, "src/modules/classifieds/components/detail/AdStats.tsx"),
      ),
    ).toBe(false);
  });
});
