import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("MVP canonical routing without compatibility redirects", () => {
  it("keeps private Profile routes canonical under /conta", () => {
    const routes = read("src/app/routes/sections/AppLayoutRoutes.tsx");
    const accountPaths = read("src/core/routing/config/account.ts");
    const registry = read("tools/architecture/architecture-registry.ts");
    const audit = read("tools/architecture/generate-architecture-audit.ts");

    expect(routes).toContain("path={ACCOUNT_PATHS.home}");
    expect(routes).toContain('path="/conta/editar/:profileId"');
    expect(routes).toContain("path={ACCOUNT_PATHS.notifications}");
    expect(accountPaths).toContain('home: "/conta"');
    expect(accountPaths).toContain('notifications: "/conta/notificacoes"');

    expect(routes).not.toContain('path="/perfil"');
    expect(routes).not.toContain('path="/perfil/');
    expect(routes).not.toContain("LegacyProfileEditRedirect");

    expect(registry).toContain('"/conta"');
    expect(registry).toContain('"/conta/editar/:profileId"');
    expect(registry).not.toContain('"/perfil"');
    expect(registry).not.toContain('"/perfil/editar/:profileId"');

    expect(audit).toContain('["/conta", "profile"]');
    expect(audit).not.toContain('["/perfil", "profile"]');
    expect(audit).not.toContain('["/profile", "profile"]');
  });

  it("requires an explicit profileId for private profile editing", () => {
    const routes = read("src/app/routes/sections/AppLayoutRoutes.tsx");
    const activeLazyImports = read("src/app/routes/activeLazyImports.ts");
    const profileBarrel = read("src/modules/profile/index.ts");

    expect(routes).toContain('path="/conta/editar/:profileId"');
    expect(routes).not.toContain('path="/conta/editar"');
    expect(activeLazyImports).not.toContain("ContaEditarPage");
    expect(profileBarrel).not.toContain("ContaEditarPage");
    expect(
      existsSync(resolve(root, "src/modules/profile/pages/ContaEditarPage.tsx")),
    ).toBe(false);
  });

  it("keeps canonical Notifications active while retired aliases stay dead", () => {
    const routes = read("src/app/routes/sections/AppLayoutRoutes.tsx");
    const accountPaths = read("src/core/routing/config/account.ts");
    const notificationRoutes = read(
      "src/core/notifications/routes/notificationRoutes.ts",
    );
    const notifications = read("src/app/pages/NotificationsPage.tsx");
    const preferences = read("src/app/pages/NotificationPreferencesPage.tsx");
    const prefetch = read("src/app/routes/prefetch.ts");
    const serviceWorker = read("public/sw.js");
    const notificationItem = read(
      "src/app/components/notifications/NotificationItem.tsx",
    );
    const notificationActionScope = read(
      "src/app/config/notificationActionScope.ts",
    );

    expect(routes).toContain("path={notificationRoutes.inbox()}");
    expect(notificationRoutes).toContain('inbox: () => "/notificacoes"');
    expect(routes).toContain("path={ACCOUNT_PATHS.notifications}");
    expect(accountPaths).toContain('notifications: "/conta/notificacoes"');
    expect(routes).not.toContain('path="/notificacoes"');
    expect(routes).not.toContain('path="/notifications"');
    expect(routes).not.toContain('path="/settings/notifications"');

    expect(notifications).toContain("navigate(ACCOUNT_PATHS.notifications)");
    expect(notifications).not.toContain("/settings/notifications");
    expect(preferences).not.toContain("/settings/notifications");

    // Active does not imply eager prefetch/warmup.
    expect(prefetch).not.toContain('path.startsWith("/notifications")');
    expect(serviceWorker).toContain("function getLaunchSafeNotificationUrl(url, fallback = '/notificacoes')");
    expect(serviceWorker).not.toContain("notificacoes|mensagens");
    expect(serviceWorker).toContain("gastronomia|servicos|services|classificados|classifieds");
    expect(serviceWorker).toContain("return getLaunchSafeNotificationUrl(data.url, '/mensagens')");
    expect(serviceWorker).toContain("return '/conta/notificacoes'");
    expect(serviceWorker).not.toContain("return '/notifications'");

    expect(notificationItem).toContain("resolveNotificationActionTarget");
    expect(notificationItem).not.toContain("href={notification.action_url}");
    expect(notificationActionScope).toContain("NOTIFICATION_INBOX_PATH");
    expect(notificationActionScope).toContain("NOTIFICATION_FALLBACK_ACTION_LABEL");
    expect(notificationActionScope).toContain('surface: "gastronomy"');
    expect(notificationActionScope).toContain('surface: "mobility"');
    expect(notificationActionScope).not.toContain("/^\\/notificacoes(?:\\/|$)/i");
  });

  it("does not preserve query-param redirects for retired account navigation", () => {
    const preferences = read("src/modules/profile/pages/ContaPreferenciasPage.tsx");
    const mobileE2e = read("tests/e2e/mobile-auth-dashboards.spec.ts");

    expect(preferences).not.toContain("legacyTab");
    expect(preferences).not.toContain("useSearchParams");
    expect(mobileE2e).not.toContain("legacy conta preferencias");
    expect(mobileE2e).not.toContain("/conta/preferencias?tab=privacy");
  });

  it("renders NotFound for unknown lockdown routes instead of redirecting home", () => {
    const rootRoutes = read("src/app/routes/AppRoutes.tsx");

    expect(rootRoutes).toContain(
      'const NotFoundPage = lazy(() => import("@/app/pages/NotFound"))',
    );
    expect(rootRoutes).toContain(
      '<Route path="*" element={<NotFoundPage />} />',
    );
    expect(rootRoutes).not.toContain('<Navigate to="/" replace />');
  });
});