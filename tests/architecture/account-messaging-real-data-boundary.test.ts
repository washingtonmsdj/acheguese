import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const routes = read("src/app/routes/sections/AppLayoutRoutes.tsx");
const account = read("src/modules/profile/pages/ContaHubPage.tsx");
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
  it("keeps account and Messaging authenticated without concept bypasses", () => {
    expect(routes).not.toContain("conceptMessagesPreview");
    expect(routes).not.toContain("conceptAccountPreview");
    expect(routes).not.toContain('get("concept-mock")');
    expect(routes).toContain('path="/conta"');
    expect(routes).toContain("protectedElement(<P.ContaPage />)");
    expect(routes).toContain('path="/mensagens"');
    expect(routes).toContain('path="/mensagens/:providerId/:threadId"');
    expect(routes).not.toContain('path="/chat/:conversationId"');
    expect(routes).toContain('"messaging"');
  });

  it("keeps the account overview on the live profile workspace", () => {
    expect(account).not.toContain("concept-mock");
    expect(account).not.toContain("AccountConceptPreviewPage");
    expect(account).not.toContain("conceptManagedProfiles");
    expect(account).not.toContain("Dados demonstrativos");
    expect(account).toContain("useProfileHub()");
    expect(account).toContain(
      "const resolvedProfile = data.profile ?? data.activeProfile ?? null",
    );
    expect(account).toContain("if (data.loading && !resolvedProfile)");
    expect(account).toContain("profile={resolvedProfile}");
    expect(account).not.toContain("if (data.loading) {");
    expect(account).toContain("data.allProfiles");
    expect(account).toContain('title="Mensagens"');
    expect(account).toContain('navigate("/mensagens")');
  });

  it("keeps the global Inbox provider-based instead of Community-owned", () => {
    expect(inbox).toContain("providerIds");
    expect(inbox).toContain("getMessagingProvider(providerId)");
    expect(inbox).toContain("useSessionContext()");
    expect(inbox).not.toContain("useCommunityDirectMessages");
    expect(inbox).not.toContain("concept-mock");
    expect(inbox).not.toContain("localMessages");

    expect(providerRegistry).toContain("businessMessagingProvider");
    expect(providerRegistry).not.toContain("@/app/");
    expect(providerScope).toContain('isPlatformCapabilityEnabled("messaging")');
    expect(providerScope).toContain('isProductModuleEnabled(productModule)');
    expect(providerScope).toContain('getMessagingProvider(providerId) !== null');

    expect(businessProvider).toContain("businessDirectMessagingService");
    expect(businessProvider).not.toContain("community");
    expect(businessProvider).not.toContain("classified");
  });

  it("preserves Community Direct Messaging as a separate domain-specific UI", () => {
    expect(communityMessaging).toContain("useCommunityDirectMessages()");
    expect(communityMessaging).toContain("useSessionContext()");
    expect(inbox).not.toContain("CommunityDirectMessagesPage");
  });
});
