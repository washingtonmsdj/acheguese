import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PLATFORM_CAPABILITY_REGISTRY } from "../../src/app/config/platformCapabilityRegistry";
import { DOMAIN_REGISTRY } from "../../tools/architecture/architecture-registry";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const appRoutes = read("src/app/routes/sections/AppLayoutRoutes.tsx");
const activeLazyImports = read("src/app/routes/activeLazyImports.ts");

describe("Messaging and Notifications architecture ownership", () => {
  it("keeps horizontal owners distinct in the architecture registry", () => {
    const messaging = DOMAIN_REGISTRY.find((entry) => entry.id === "messaging");
    const notifications = DOMAIN_REGISTRY.find(
      (entry) => entry.id === "notifications",
    );

    expect(messaging).toBeDefined();
    expect(notifications).toBeDefined();

    expect(messaging?.sourceRoots).toContain("src/core/messaging");
    expect(messaging?.sourceRoots).toContain("src/modules/messaging");
    expect(messaging?.routePrefixes).toEqual(["/mensagens"]);
    expect(messaging?.ssotPaths).toContain(
      "src/core/messaging/providers/messagingProviderRegistry.ts",
    );

    expect(notifications?.sourceRoots).toContain("src/core/notifications");
    expect(notifications?.sourceRoots).not.toContain("src/core/messaging");
    expect(notifications?.routePrefixes).toEqual([
      "/notificacoes",
      "/conta/notificacoes",
    ]);
    expect(notifications?.routePrefixes).not.toContain("/mensagens");
  });

  it("keeps both platform capabilities active without product-module dependencies", () => {
    expect(PLATFORM_CAPABILITY_REGISTRY.messaging.status).toBe("active");
    expect(PLATFORM_CAPABILITY_REGISTRY.notifications.status).toBe("active");
    expect(PLATFORM_CAPABILITY_REGISTRY.messaging.dependsOnProductModules).toBeUndefined();
    expect(PLATFORM_CAPABILITY_REGISTRY.notifications.dependsOnProductModules).toBeUndefined();

    expect(appRoutes).toContain('isPlatformCapabilityEnabled("messaging")');
    expect(appRoutes).toContain('isPlatformCapabilityEnabled("notifications")');
    expect(appRoutes).toContain("messagingRoutes.inbox()");
    expect(appRoutes).toContain('path="/notificacoes"');
    expect(appRoutes).toContain("ACCOUNT_PATHS.notifications");
    expect(activeLazyImports).toContain("MessagingInboxPage");
    expect(activeLazyImports).toContain("NotificationsPage");
    expect(activeLazyImports).toContain("NotificationPreferencesPage");
  });

  it("keeps platform ownership independent from Business", () => {
    const messagingBlock =
      read("src/app/config/platformCapabilityRegistry.ts").match(
        /\n  messaging: \{[\s\S]*?\n  \},/,
      )?.[0] ?? "";
    const notificationsBlock =
      read("src/app/config/platformCapabilityRegistry.ts").match(
        /\n  notifications: \{[\s\S]*?\n  \},/,
      )?.[0] ?? "";

    expect(messagingBlock).not.toContain("business");
    expect(notificationsBlock).not.toContain("business");
  });
});
