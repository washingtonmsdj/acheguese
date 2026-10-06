import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const appShell = read("src/app/components/AppLayoutSidebar.tsx");
const publicInfoShell = read(
  "src/app/components/public/PublicInfoPageShell.tsx",
);
const messagingPage = read("src/modules/messaging/pages/MensagensPage.tsx");

describe("main landmark ownership SSOT", () => {
  it("keeps child-owned main routes explicit at the App shell boundary", () => {
    const ownedRoutes =
      appShell.match(
        /const CHILD_OWNED_MAIN_ROUTES = new Set<string>\(\[[\s\S]*?\]\);/,
      )?.[0] ?? "";

    for (const route of [
      "/mensagens",
      "/termos",
      "/privacidade",
      "/offline-settings",
      "/dpo",
    ]) {
      expect(ownedRoutes, route).toContain(`"${route}"`);
    }

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
      'pathSegments[0] === "mensagens" && pathSegments.length >= 3',
    );
    expect(appShell).toContain(
      '<div className="messaging-route-shell h-[100dvh] w-full overflow-hidden bg-territory-canvas">',
    );
  });
});
