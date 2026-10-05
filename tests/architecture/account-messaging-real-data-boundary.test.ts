import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const routes = read("src/app/routes/sections/AppLayoutRoutes.tsx");
const platformRegistry = read("src/app/config/platformCapabilityRegistry.ts");
const messagingRoutes = read("src/core/messaging/routes/messagingRoutes.ts");
const account = read("src/modules/profile/pages/ContaHubPage.tsx");
const appUrls = read("src/core/routing/hooks/useAppUrls.ts");
const appTopbar = read("src/app/components/navigation/AppTopbar.tsx");
const inbox = read("src/modules/messaging/pages/MensagensPage.tsx");
const providerRegistry = read(
  "src/core/messaging/providers/messagingProviderRegistry.ts",
);
const providerScope = read("src/app/config/messagingProviderScope.ts");
const businessProvider = read(
  "src/core/messaging/providers/BusinessMessagingProvider.ts",
);
const communityMessaging = read(
  "src/modules/community-feed/pages/CommunityDirectMessagesPage.tsx",
);

describe("account and horizontal messaging real-data boundary", () => {
  it("keeps Account and Messaging active as independent platform surfaces", () => {
    expect(routes).not.toContain("conceptMessagesPreview");
    expect(routes).not.toContain("conceptAccountPreview");
    expect(routes).not.toContain('get("concept-mock")');
    expect(routes).toContain('path="/conta"');
    expect(routes).toContain("protectedElement(<P.ContaPage />)");
    expect(routes).toContain("messagingRoutes.inbox()");
    expect(routes).toContain("messagingRoutes.threadPattern()");
    expect(routes).toContain("<P.MessagingInboxPage />");
    expect(messagingRoutes).toContain('inbox: () => "/mensagens"');
    expect(messagingRoutes).toContain(
      'threadPattern: () => "/mensagens/:providerId/:threadId"',
    );
    expect(routes).not.toContain('path="/chat/:conversationId"');
    expect(appUrls).not.toContain("chat: (conversationId");
    expect(appUrls).not.toContain("/chat/");
    expect(appUrls).toContain("messages: messagingRoutes.inbox()");

    const messagingBlock =
      platformRegistry.match(/\n  messaging: \{[\s\S]*?\n  \},/)?.[0] ?? "";
    expect(messagingBlock).toContain('status: "active"');
    expect(messagingBlock).not.toContain("dependsOnProductModules");
  });

  it("keeps Account overview on live profile data without owning Messaging or Notifications", () => {
    expect(account).not.toContain("concept-mock");
    expect(account).not.toContain("AccountConceptPreviewPage");
    expect(account).not.toContain("conceptManagedProfiles");
    expect(account).not.toContain("Dados demonstrativos");
    expect(account).toContain("useProfileHub()");
    expect(account).toContain(
      "const resolvedProfile = data.profile ?? data.activeProfile ?? null",
    );
    expect(account).toContain("profile={resolvedProfile}");
    expect(account).toContain("data.allProfiles");
  });

  it("keeps the global Messaging action lifecycle-owned", () => {
    expect(appTopbar).toContain(
      'const showMessages = isPlatformCapabilityEnabled("messaging")',
    );
    expect(appTopbar).not.toContain("isLaunchSurfaceEnabled");
    expect(appTopbar).not.toContain('"communityCommunication"');
    expect(appTopbar).toContain("to={appUrls.messages}");
  });

  it("keeps the active global Inbox provider-based instead of Business-owned", () => {
    expect(inbox).toContain("providerIds");
    expect(inbox).toContain("providerIds.map");
    expect(inbox).toContain("getMessagingProvider");
    expect(inbox).toContain("MessagingInboxProvider");
    expect(inbox).toContain("useSessionContext()");
    expect(inbox).not.toContain("useCommunityDirectMessages");
    expect(inbox).not.toContain("concept-mock");
    expect(inbox).not.toContain("localMessages");

    expect(providerRegistry).toContain("businessMessagingProvider");
    expect(providerRegistry).not.toContain("@/app/");
    expect(providerScope).toContain('isPlatformCapabilityEnabled("messaging")');
    expect(providerScope).toContain("isProductModuleEnabled(productModule)");
    expect(providerScope).toContain("getMessagingProvider(providerId) !== null");

    expect(businessProvider).toContain("businessDirectMessagingService");
    expect(businessProvider).not.toContain("community");
    expect(businessProvider).not.toContain("classified");
  });

  it("preserves Community Direct Messaging as a separate paused-domain UI", () => {
    expect(communityMessaging).toContain("useCommunityDirectMessages()");
    expect(communityMessaging).toContain("useSessionContext()");
    expect(inbox).not.toContain("CommunityDirectMessagesPage");
  });
});
