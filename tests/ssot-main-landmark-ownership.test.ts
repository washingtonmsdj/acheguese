import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const appShell = read("src/app/components/AppLayoutSidebar.tsx");
const appRoutes = read("src/app/routes/sections/AppLayoutRoutes.tsx");
const platformSettings = read("src/core/routing/config/platformSettings.ts");
const protectedRoute = read("src/core/routing/components/ProtectedRoute.tsx");
const messagingPage = read("src/modules/messaging/pages/MensagensPage.tsx");
const publicInfoShell = read(
  "src/app/components/public/PublicInfoPageShell.tsx",
);

describe("main landmark ownership SSOT", () => {
  it("keeps child-owned routes on canonical route owners", () => {
    const ownedRoutes =
      appShell.match(
        /const CHILD_OWNED_MAIN_ROUTES = new Set<string>\(\[[\s\S]*?\]\);/,
      )?.[0] ?? "";

    expect(appShell).toContain(
      "const MESSAGING_INBOX_PATH = messagingRoutes.inbox();",
    );
    expect(ownedRoutes).toContain("MESSAGING_INBOX_PATH");
    expect(appRoutes).toContain("path={messagingRoutes.inbox()}");

    for (const routeOwner of [
      "TERMS_OF_SERVICE_PATH",
      "PRIVACY_POLICY_PATH",
      "OFFLINE_SETTINGS_PATH",
      "DATA_PROTECTION_CONTACT_PATH",
    ]) {
      expect(ownedRoutes, routeOwner).toContain(routeOwner);
      expect(appRoutes, routeOwner).toContain(`path={${routeOwner}}`);
    }

    expect(platformSettings).toContain(
      'export const OFFLINE_SETTINGS_PATH = "/offline-settings";',
    );
    expect(appShell).not.toMatch(
      /["']\/(?:mensagens|termos|privacidade|offline-settings|dpo)["']/,
    );
    expect(appRoutes).not.toMatch(
      /path=["']\/(?:termos|privacidade|offline-settings|dpo)["']/,
    );
  });

  it("delegates the global shell main landmark for child-owned routes", () => {
    expect(appShell).toContain(
      "const childOwnsMainLandmark = CHILD_OWNED_MAIN_ROUTES.has(pathname);",
    );
    expect(appShell).toContain(
      'const MainContentElement = childOwnsMainLandmark ? "div" : "main";',
    );
    expect(appShell).toContain(
      'id={childOwnsMainLandmark ? undefined : "main-content"}',
    );
    expect(appShell).toContain(
      "tabIndex={childOwnsMainLandmark ? undefined : -1}",
    );
  });

  it("preserves the PublicInfoPageShell main landmark and skip-link focus owner", () => {
    expect(publicInfoShell).toContain('<main\n        id="main-content"');
    expect(publicInfoShell).toContain("tabIndex={-1}");
  });

  it("keeps protected Messaging with exactly one main owner during access gates", () => {
    const ownedRoutes =
      appShell.match(
        /const CHILD_OWNED_MAIN_ROUTES = new Set<string>\(\[[\s\S]*?\]\);/,
      )?.[0] ?? "";

    expect(ownedRoutes).toContain("MESSAGING_INBOX_PATH");
    expect(protectedRoute).toContain(
      "const MESSAGING_INBOX_PATH = messagingRoutes.inbox();",
    );
    expect(protectedRoute).toContain(
      "const protectedRouteOwnsMainLandmark =",
    );
    expect(protectedRoute).toContain(
      "location.pathname.startsWith(`${MESSAGING_INBOX_PATH}/`)",
    );
    expect(protectedRoute).toContain(
      'const LoadingElement = ownsMainLandmark ? "main" : "div";',
    );
    expect(protectedRoute).toContain(
      'id={ownsMainLandmark ? "main-content" : undefined}',
    );
    expect(protectedRoute).toContain(
      'tabIndex={ownsMainLandmark ? -1 : undefined}',
    );
    expect(protectedRoute).toContain(
      '<div role="status" aria-live="polite" className="space-y-3 text-center">',
    );
    expect(protectedRoute).not.toMatch(/["']\/mensagens(?:\/|["'])/);
    expect(appShell).toContain(
      "pathname.startsWith(`${MESSAGING_INBOX_PATH}/`) && pathSegments.length >= 3",
    );
    expect(appShell).toContain(
      '<div className="messaging-route-shell h-[100dvh] w-full overflow-hidden bg-territory-canvas">',
    );
  });

  it("keeps MessagingInboxScreen as the loaded main landmark owner", () => {
    expect(messagingPage).toContain('data-page="messaging-inbox"');
    expect(messagingPage.match(/id="main-content"/g)?.length).toBe(3);
  });
});
