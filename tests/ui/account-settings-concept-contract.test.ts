import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const shell = read("src/modules/profile/components/AccountSettingsShell.tsx");
const overview = read("src/modules/profile/pages/ContaHubLayout.tsx");
const managedProfiles = read(
  "src/modules/profile/components/ManagedProfilesPanel.tsx",
);
const security = read("src/modules/profile/pages/ContaSegurancaPage.tsx");
const preferences = read("src/modules/profile/pages/ContaPreferenciasPage.tsx");
const accessibilityProvider = read(
  "src/shared/components/accessibility/AccessibilityProvider.tsx",
);
const auth = read("src/core/auth/services/AuthService.ts");
const identities = read("src/core/auth/services/AuthIdentityService.ts");
const notifications = read("src/app/pages/NotificationPreferencesPage.tsx");
const privacy = read("src/app/pages/PrivacySettingsPage.tsx");
const push = read("src/app/components/notifications/PushNotificationSettings.tsx");
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
      "Acessibilidade",
      "Meus perfis",
    ]) {
      expect(shell).toContain(label);
    }
    expect(shell).toContain("achegue-se");
    expect(shell).toContain("showBack");
    expect(shell).toContain('search: "?section=profiles"');
    expect(shell).toContain('excludeSearch: "?section=profiles"');
    expect(shell).toContain('hash: "#acessibilidade"');
    expect(shell).toContain('excludeHash: "#acessibilidade"');
  });

  it("keeps live overview aligned with the concept without dropping real features", () => {
    expect(overview).toContain('profilesView ? "Meus perfis" : "Minha conta"');
    expect(overview).toContain("Dados de acesso");
    expect(overview).toContain("Senha e segurança");
    expect(overview).toContain("Privacidade e dados");
    expect(overview).toContain("Acessibilidade");
    expect(overview).toContain("Meus perfis");
    expect(overview).toContain("Sair da conta");
    expect(overview).toContain("<ManagedProfilesPanel />");
    expect(overview).toContain("Controles avançados e recursos operacionais");
    expect(overview).toContain("{children}");
    expect(overview).toContain('navigate("/conta?section=profiles")');
  });

  it("uses real multi-profile state for the managed profiles concept surface", () => {
    expect(managedProfiles).toContain("useMultiProfileContext()");
    expect(managedProfiles).toContain("activeProfile");
    expect(managedProfiles).toContain("allProfiles");
    expect(managedProfiles).toContain("switchProfile(profile.id)");
    expect(managedProfiles).toContain("buildProfileEditUrl(profile.id)");
    expect(managedProfiles).toContain("buildPublicProfileUrl(handle!)");
    expect(managedProfiles).toContain("profile.is_public === true");
    expect(managedProfiles).toContain('type="search"');
    expect(managedProfiles).toContain('aria-pressed={selected}');
    expect(managedProfiles).not.toContain("conceptManagedProfiles");
  });

  it("renders access, email, password and MFA as explicit real states", () => {
    expect(security).toContain('location.hash === "#acesso"');
    expect(security).toContain('location.hash === "#email"');
    expect(security).toContain('location.hash === "#senha"');
    expect(security).toContain('title="Dados de acesso"');
    expect(security).toContain('title="Alterar e-mail de acesso"');
    expect(security).toContain('title="Alterar senha"');
    expect(security).toContain("user.emailConfirmed");
    expect(security).toContain("useLinkedAuthProviders");
    expect(security).toContain("googleLinked");
    expect(security).toContain("useMFA()");
    expect(security).toContain("startEnrollment");
    expect(security).toContain("verifyAndEnable");
    expect(security).toContain("signOutOtherSessions");
    expect(auth).toContain('signOut({ scope: "others" })');
    expect(auth).toContain("static async updateEmail");
    expect(identities).toContain("supabase.auth.getUser()");
    expect(identities).toContain('providers.includes("google")');
  });

  it("keeps accessibility preferences on the canonical runtime owner", () => {
    expect(preferences).toContain('location.hash === "#acessibilidade"');
    expect(preferences).toContain("useAccessibility()");
    expect(preferences).toContain("isHighContrast");
    expect(preferences).toContain("setFontSize");
    expect(preferences).toContain('window.matchMedia("(prefers-reduced-motion: reduce)")');
    expect(preferences).not.toContain("localStorage");
    expect(accessibilityProvider).toContain("persistAccessibilityHighContrast");
    expect(accessibilityProvider).toContain("persistAccessibilityFontSize");
    expect(accessibilityProvider).toContain("applyAccessibilityPreferences");
  });

  it("preserves canonical notification and privacy service writes", () => {
    expect(notifications).toContain("NotificationPreferencesService.get()");
    expect(notifications).toContain("NotificationPreferencesService.patchAll(prefs)");
    expect(privacy).toContain("PrivacySettingsService.recordConsent");
    expect(privacy).toContain("PrivacySettingsService.exportUserData");
    expect(privacy).toContain("PrivacySettingsService.requestAccountDeletion");
    expect(privacy).toContain("PrivacySettingsService.cancelAccountDeletion");
  });

  it("exposes concept export and device states without inventing data", () => {
    expect(privacy).toContain('location.hash === "#exportar"');
    expect(privacy).toContain('title="Uma cópia dos seus dados"');
    expect(privacy).toContain('idPrefix="summary"');
    expect(privacy).toContain('idPrefix="details"');
    expect(push).toContain("usePush(user?.id)");
    expect(push).toContain("isSupported");
    expect(push).toContain("hasPermission");
    expect(push).toContain("isSubscribed");
  });

  it("scopes exclusive shell ownership to migrated account routes", () => {
    expect(appLayout).toContain("ACCOUNT_SETTINGS_SHELL_PATHS");
    expect(appLayout).toContain("accountUsesSettingsShell");
    expect(appLayout).toContain('id={accountUsesSettingsShell ? undefined : "main-content"}');
    expect(appLayout).toContain("conceptAccountPreview || accountUsesSettingsShell");
    expect(appLayout).toContain("accountUsesSettingsShell && !isAccountOverview");
  });
});
