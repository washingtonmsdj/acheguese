import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const appShell = read("src/app/components/AppLayoutSidebar.tsx");
const appRoutes = read("src/app/routes/sections/AppLayoutRoutes.tsx");
const platformSettings = read("src/core/routing/config/platformSettings.ts");
const publicInfoShell = read(
  "src/app/components/public/PublicInfoPageShell.tsx",
);
const messagingPage = read("src/modules/messaging/pages/MensagensPage.tsx");

describe("main landmark ownership SSOT", () => {
  it("keeps child-owned main routes on canonical route owners", () => {
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

  it("delegates the global shell main landmark only for child-owned routes", () => {
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

  it("preserves the child main landmarks that own skip-link focus", () => {
    expect(publicInfoShell).toContain('<main\n        id="main-content"');
    expect(messagingPage.match(/id="main-content"/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps focused message threads outside the global main wrapper", () => {
    expect(appShell).toContain(
      "pathname.startsWith(`${MESSAGING_INBOX_PATH}/`) && pathSegments.length >= 3",
    );
    expect(appShell).toContain(
      '<div className="messaging-route-shell h-[100dvh] w-full overflow-hidden bg-territory-canvas">',
    );
  });
});
