import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("MVP canonical routing without compatibility redirects", () => {
  it("keeps private Profile routes canonical under /conta", () => {
    const routes = read("src/app/routes/sections/AppLayoutRoutes.tsx");
    const registry = read("tools/architecture/architecture-registry.ts");
    const audit = read("tools/architecture/generate-architecture-audit.ts");

    expect(routes).toContain('path="/conta"');
    expect(routes).toContain('path="/conta/editar/:profileId"');
    expect(routes).toContain('path="/conta/notificacoes"');

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

  it("keeps notification inbox and preferences horizontal and canonical", () => {
    const routes = read("src/app/routes/sections/AppLayoutRoutes.tsx");
    const activeLazyImports = read("src/app/routes/activeLazyImports.ts");
    const prefetch = read("src/app/routes/prefetch.ts");
    const serviceWorker = read("public/sw.js");
    const appTopbar = read("src/app/components/navigation/AppTopbar.tsx");
    const centralHeader = read("src/modules/central/components/CentralHeader.tsx");
    const businessDetail = read(
      "src/modules/business/company/pages/EmpresaDetailLayout.tsx",
    );
    const account = read("src/modules/profile/pages/ContaHubPage.tsx");

    expect(routes).toContain('path="/notificacoes"');
    expect(routes).toContain('path="/conta/notificacoes"');
    expect(routes).not.toContain('path="/notifications"');
    expect(routes).not.toContain('path="/settings/notifications"');
    expect(routes).not.toContain('path="/settings/email-logs"');

    expect(activeLazyImports).toContain("NotificationsPage");
    expect(activeLazyImports).toContain("NotificationPreferencesPage");
    expect(activeLazyImports).not.toContain("EmailLogsPage");
    expect(prefetch).toContain('path.startsWith("/notificacoes")');
    expect(prefetch).toContain('{ href: "/notificacoes", surface: "notifications" }');

    expect(serviceWorker).toContain("case 'message':");
    expect(serviceWorker).toContain("return '/mensagens';");
    expect(serviceWorker).toContain("case 'settings':");
    expect(serviceWorker).toContain("return '/conta/notificacoes';");
    expect(serviceWorker).toContain("fallback = '/notificacoes'");

    expect(appTopbar).toContain("appUrls.notifications");
    expect(centralHeader).toContain('to="/notificacoes"');
    expect(businessDetail).toContain('to="/notificacoes"');
    expect(account).toContain("appUrls.profile.notifications");
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
