import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const shell = read("src/modules/profile/components/AccountSettingsShell.tsx");
const overview = read("src/modules/profile/pages/ContaHubLayout.tsx");
const security = read("src/modules/profile/pages/ContaSegurancaPage.tsx");
const notifications = read("src/app/pages/NotificationPreferencesPage.tsx");
const privacy = read("src/app/pages/PrivacySettingsPage.tsx");
const appLayout = read("src/app/components/AppLayoutSidebar.tsx");

describe("account settings concept contract", () => {
  it("keeps the canonical account information architecture in one shell", () => {
    for (const label of [
      "Visão geral",
      "Dados de acesso",
      "Segurança",
      "Notificações",
      "Privacidade e dados",
      "Preferências",
      "Meus perfis",
    ]) {
      expect(shell).toContain(label);
    }
    expect(shell).toContain("achegue-se");
    expect(shell).toContain("showBack");
    expect(shell).toContain('search: "?section=profiles"');
    expect(shell).toContain('excludeSearch: "?section=profiles"');
  });

  it("keeps live overview aligned with the concept without dropping real features", () => {
    expect(overview).toContain('profilesView ? "Meus perfis" : "Minha conta"');
    expect(overview).toContain("Dados de acesso");
    expect(overview).toContain("Senha e segurança");
    expect(overview).toContain("Privacidade e dados");
    expect(overview).toContain("Meus perfis");
    expect(overview).toContain("Sair da conta");
    expect(overview).toContain("{children}");
    expect(overview).toContain('navigate("/conta?section=profiles")');
  });

  it("renders data access as an explicit state and keeps MFA connected to its canonical hook", () => {
    expect(security).toContain('location.hash === "#acesso"');
    expect(security).toContain('title="Dados de acesso"');
    expect(security).toContain("user.emailConfirmed");
    expect(security).toContain("googleAuthAvailable");
    expect(security).toContain("useMFA()");
    expect(security).toContain("startEnrollment");
    expect(security).toContain("verifyAndEnable");
  });

  it("preserves canonical notification and privacy service writes", () => {
    expect(notifications).toContain("NotificationPreferencesService.get()");
    expect(notifications).toContain("NotificationPreferencesService.patchAll(prefs)");
    expect(privacy).toContain("PrivacySettingsService.recordConsent");
    expect(privacy).toContain("PrivacySettingsService.exportUserData");
    expect(privacy).toContain("PrivacySettingsService.requestAccountDeletion");
    expect(privacy).toContain("PrivacySettingsService.cancelAccountDeletion");
  });

  it("prevents the global desktop navigation from stacking over the account shell", () => {
    expect(appLayout).toContain('isAccountOverview = pathname === "/conta"');
    expect(appLayout).toContain("conceptAccountPreview || isAccountRoute");
    expect(appLayout).toContain("isAccountRoute && !isAccountOverview");
  });
});
