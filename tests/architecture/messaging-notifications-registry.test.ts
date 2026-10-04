import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PLATFORM_CAPABILITY_REGISTRY } from "../../src/app/config/platformCapabilityRegistry";
import { DOMAIN_REGISTRY } from "../../tools/architecture/architecture-registry";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const appRoutes = read("src/app/routes/sections/AppLayoutRoutes.tsx");
const activeLazyImports = read("src/app/routes/activeLazyImports.ts");
const coreMessagingReadme = read("src/core/messaging/README.md");
const messagingUiReadme = read("src/modules/messaging/README.md");
const notificationsReadme = read("src/core/notifications/README.md");

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

  it("keeps both capabilities paused outside the certified MVP route graph", () => {
    expect(PLATFORM_CAPABILITY_REGISTRY.messaging.status).toBe("paused");
    expect(PLATFORM_CAPABILITY_REGISTRY.notifications.status).toBe("paused");

    expect(appRoutes).not.toContain('path="/mensagens"');
    expect(appRoutes).not.toContain('path="/notificacoes"');
    expect(appRoutes).not.toContain('path="/conta/notificacoes"');
    expect(activeLazyImports).not.toContain("MessagingInboxPage");
    expect(activeLazyImports).not.toContain("NotificationsPage");
  });

  it("keeps living owner documentation aligned with the paused lifecycle", () => {
    expect(coreMessagingReadme).toContain("PAUSADA NO MVP");
    expect(coreMessagingReadme).toContain("`messaging=false`");
    expect(coreMessagingReadme).toContain(
      "Rotas canônicas versionadas para futura reativação",
    );
    expect(coreMessagingReadme).not.toContain("ATIVO NO MVP");

    expect(messagingUiReadme).toContain("pausado no MVP");
    expect(messagingUiReadme).toContain("`messaging=false`");
    expect(messagingUiReadme).not.toContain("active in the MVP");

    expect(notificationsReadme).toContain("INBOX/UI PAUSADA NO MVP");
    expect(notificationsReadme).toContain("`notifications=false`");
    expect(notificationsReadme).toContain(
      "Messaging e Notifications possuem owners, rotas e lifecycle distintos",
    );
    expect(notificationsReadme).not.toContain(
      "CAPABILITY HORIZONTAL ATIVA NO MVP",
    );
  });
});
