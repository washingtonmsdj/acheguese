import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const routes = read("src/app/routes/sections/AppLayoutRoutes.tsx");
const sidebar = read("src/app/components/AppLayoutSidebar.tsx");
const account = read("src/modules/profile/pages/ContaHubPage.tsx");
const messaging = read("src/modules/messaging/pages/MensagensPage.tsx");
const messagingHook = read(
  "src/core/messaging/hooks/useCommunityDirectMessages.ts",
);

describe("account and messaging MVP real-data boundary", () => {
  it("keeps account and messaging routes authenticated without concept bypasses", () => {
    expect(routes).not.toContain("conceptMessagesPreview");
    expect(routes).not.toContain("conceptAccountPreview");
    expect(routes).not.toContain('get("concept-mock")');
    expect(routes).toContain('path="/conta"');
    expect(routes).toContain("protectedElement(<P.ContaPage />)");
    expect(routes).toContain('path="/mensagens"');
    expect(routes).toContain('path="/chat/:conversationId"');
    expect(routes).toContain('"communityCommunication"');
  });

  it("keeps the account overview on the live profile workspace", () => {
    expect(account).not.toContain("concept-mock");
    expect(account).not.toContain("AccountConceptPreviewPage");
    expect(account).not.toContain("conceptManagedProfiles");
    expect(account).not.toContain("Dados demonstrativos");
    expect(account).toContain("useProfileHub()");
    expect(account).toContain("data.allProfiles");
    expect(sidebar).not.toContain("conceptAccountPreview");
  });

  it("uses only session profiles and persisted community conversations", () => {
    for (const marker of [
      "concept-mock",
      "conceptConversations",
      "conceptMessages",
      "conceptConversationIdsByProfile",
      "Sabores da Ana",
      "almoço caseiro",
      "Ana Silva",
      "Ana Serviços",
    ]) {
      expect(messaging).not.toContain(marker);
    }

    expect(messaging).toContain("useSessionContext()");
    expect(messaging).toContain("useCommunityDirectMessages()");
    expect(messaging).toContain("sessionProfiles.map((profile)");
    expect(messaging).toContain("key: profile.id");
    expect(messaging).toContain("liveThreads.map(toInboxConversation)");
    expect(messaging).toContain("contextTitle: thread.post_title || undefined");
    expect(messaging).toContain('to="/notificacoes"');
    expect(messaging).not.toContain('aria-label="Abrir filtros"');
    expect(messaging).not.toContain('aria-label="Mais opções da conversa"');
    expect(messaging).not.toContain('aria-label="Adicionar anexo"');
    expect(messaging).not.toContain("localMessages");
    expect(messaging).not.toContain("local-${Date.now()}");
    expect(messaging).not.toContain("mobile-local-${Date.now()}");
    expect(messaging).toContain(
      "return sendMessage(selectedConversation.id, body);",
    );
  });

  it("clears private thread state when the active profile changes", () => {
    expect(messagingHook).toContain("setConversations([])");
    expect(messagingHook).toContain("setMessages([])");
    expect(messagingHook).toContain("setMessageCursor(null)");
    expect(messagingHook).toContain("setActiveThreadId(null)");
    expect(messagingHook).toContain("}, [profileId]);");
  });
});
