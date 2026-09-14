import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const accountRoutes = read("src/core/routing/config/account.ts");
const appUrls = read("src/core/routing/hooks/useAppUrls.ts");
const workspace = read("src/core/profiles/hooks/useContaWorkspace.ts");
const profileHub = read("src/core/profiles/hooks/useProfileHub.ts");
const shell = read("src/modules/profile/components/AccountSettingsShell.tsx");
const overview = read("src/modules/profile/pages/ContaHubLayout.tsx");
const managedProfiles = read("src/modules/profile/components/ManagedProfilesPanel.tsx");
const security = read("src/modules/profile/pages/ContaSegurancaPage.tsx");
const passwordForm = read("src/modules/profile/components/ChangePasswordForm.tsx");
const preferences = read("src/modules/profile/pages/ContaPreferenciasPage.tsx");
const addresses = read("src/modules/profile/pages/ContaEnderecosPage.tsx");
const accessibilityProvider = read("src/shared/components/accessibility/AccessibilityProvider.tsx");
const auth = read("src/core/auth/services/AuthService.ts");
const identities = read("src/core/auth/services/AuthIdentityService.ts");
const notifications = read("src/app/pages/NotificationPreferencesPage.tsx");
const privacy = read("src/app/pages/PrivacySettingsPage.tsx");
const privacyService = read("src/core/privacy/services/PrivacySettingsService.ts");
const legal = read("src/shared/constants/legal.ts");
const push = read("src/app/components/notifications/PushNotificationSettings.tsx");
const appLayout = read("src/app/components/AppLayoutSidebar.tsx");

describe("account settings concept contract", () => {
  it("keeps account paths on one routing SSOT", () => {
    for (const path of [
      'home: "/conta"',
      'profiles: "/conta?section=profiles"',
      'security: "/conta/seguranca"',
      'access: "/conta/seguranca#acesso"',
      'email: "/conta/seguranca#email"',
      'password: "/conta/seguranca#senha"',
      'mfa: "/conta/seguranca#mfa"',
      'notifications: "/conta/notificacoes"',
      'privacy: "/conta/privacidade"',
      'exportData: "/conta/privacidade#exportar"',
      'consentHistory: "/conta/privacidade#historico"',
      'preferences: "/conta/preferencias"',
      'accessibility: "/conta/preferencias#acessibilidade"',
      'addresses: "/conta/enderecos"',
    ]) {
      expect(accountRoutes).toContain(path);
    }
    expect(appUrls).toContain("ACCOUNT_PATHS.home");
    expect(appUrls).toContain("ACCOUNT_PATHS.accessibility");
    expect(accountRoutes).toContain("ACCOUNT_PATHS.addresses");
    expect(appLayout).toContain("ACCOUNT_SETTINGS_SHELL_PATHS");
    expect(shell).toContain("ACCOUNT_PATHS.profiles");
    expect(overview).toContain("ACCOUNT_PATHS.access");
    expect(preferences).toContain("ACCOUNT_PATHS.accessibility");
    expect(preferences).toContain("ACCOUNT_PATHS.addresses");
  });

  it("keeps the canonical account information architecture in one shell", () => {
    for (const label of [
      "Visão geral",
      "Dados de acesso",
      "Segurança",
      "Notificações",
      "Privacidade e dados",
      "Meus perfis",
      "Preferências",
      "Endereços e território",
      "Acessibilidade",
    ]) {
      expect(shell).toContain(label);
    }
    expect(shell).toContain("achegue-se");
    expect(shell).toContain("showBack");
    expect(shell).toContain('search: "?section=profiles"');
    expect(shell).toContain('excludeSearch: "?section=profiles"');
    expect(shell).toContain('hashes: ["#acessibilidade"]');
    expect(shell).toContain('excludeHashes: ["#acessibilidade"]');
    expect(shell).toContain("dividerBefore: true");
  });

  it("owns mobile safe areas, nested back targets and the real desktop identity", () => {
    expect(shell).toContain("env(safe-area-inset-top)");
    expect(shell).toContain("env(safe-area-inset-bottom)");
    expect(shell).toContain('id="main-content"');
    expect(shell).toContain("resolveDefaultBackTarget");
    expect(shell).toContain('hash === "#email"');
    expect(shell).toContain("return ACCOUNT_PATHS.access");
    expect(shell).toContain('["#senha", "#mfa"]');
    expect(shell).toContain("pathname === ACCOUNT_PATHS.privacy && hash");
    expect(shell).toContain('hash === "#acessibilidade"');
    expect(shell).toContain("useMultiProfileContext()");
    expect(shell).toContain("activeProfile?.display_name");
    expect(shell).toContain("activeProfile?.avatar_url");
    expect(shell).toContain("to={ACCOUNT_PATHS.profiles}");
  });

  it("keeps live overview aligned with the concept without dropping real features", () => {
    expect(overview).toContain('profilesView ? "Meus perfis" : "Minha conta"');
    expect(overview).toContain("Dados de acesso");
    expect(overview).toContain("Senha e segurança");
    expect(overview).toContain("Privacidade e dados");
    expect(overview).toContain("Acessibilidade");
    expect(overview).toContain("Endereços e território");
    expect(overview).toContain("Meus perfis");
    expect(overview).toContain("Sair da conta");
    expect(overview).toContain("<ManagedProfilesPanel />");
    expect(overview).toContain("Recursos adicionais da conta");
    expect(overview).toContain("{children}");
    expect(overview).toContain("navigate(ACCOUNT_PATHS.addresses)");
    expect(overview).toContain("navigate(ACCOUNT_PATHS.profiles)");
  });

  it("uses real multi-profile state for the managed profiles concept surface", () => {
    expect(managedProfiles).toContain("useMultiProfileContext()");
    expect(managedProfiles).toContain("activeProfile");
    expect(managedProfiles).toContain("allProfiles");
    expect(managedProfiles).toContain("switchProfile(profile.id)");
    expect(managedProfiles).toContain("switchingProfileId");
    expect(managedProfiles).toContain("buildProfileEditUrl(profile.id)");
    expect(managedProfiles).toContain("buildPublicProfileUrl(handle!)");
    expect(managedProfiles).toContain("profile.is_public === true");
    expect(managedProfiles).toContain('type="search"');
    expect(managedProfiles).toContain('role="group"');
    expect(managedProfiles).toContain('aria-pressed={selected}');
    expect(managedProfiles).not.toContain('role="tablist"');
    expect(managedProfiles).not.toContain('aria-selected={selected}');
    expect(managedProfiles).toContain("Limpar filtros");
    expect(managedProfiles).not.toContain("conceptManagedProfiles");
  });

  it("renders access email password MFA and session revocation as real states", () => {
    expect(security).toContain('location.hash === "#acesso"');
    expect(security).toContain('location.hash === "#email"');
    expect(security).toContain('location.hash === "#senha"');
    expect(security).toContain('location.hash === "#mfa"');
    expect(security).toContain('title="Dados de acesso"');
    expect(security).toContain('title="Alterar e-mail de acesso"');
    expect(security).toContain('title="Alterar senha"');
    expect(security).toContain('title="Adicione uma camada de proteção"');
    expect(security).toContain('eyebrow="Configurar autenticação"');
    expect(security).toContain("ACCOUNT_PATHS.mfa");
    expect(security).toContain("user.emailConfirmed");
    expect(security).toContain("useLinkedAuthProviders");
    expect(security).toContain("googleLinked");
    expect(security).toContain("useMFA()");
    expect(security).toContain("isMFAStatusResolved");
    expect(security).toContain("startEnrollment");
    expect(security).toContain("verifyAndEnable");
    expect(security).toContain("handleCancelMfaEnrollment");
    expect(security).toContain("listFactors");
    expect(security).toContain("factors === null");
    expect(security).toContain("disable(factor.id)");
    expect(security).toContain("signOutOtherSessions");
    expect(security).toContain("A lista de dispositivos não está disponível agora.");
    expect(security).toContain("Este dispositivo permanece conectado quando a operação é concluída.");
    expect(security).not.toContain("Sessão atual");
    expect(auth).toContain('signOut({ scope: "others" })');
    expect(auth).toContain("static async updateEmail");
    expect(identities).toContain("supabase.auth.getUser()");
    expect(identities).toContain('providers.includes("google")');
  });

  it("does not ask for a current password that the authenticated update flow never verifies", () => {
    expect(passwordForm).toContain("ResetPasswordFormSchema");
    expect(passwordForm).toContain('autoComplete="new-password"');
    expect(passwordForm).not.toContain('id="current-password"');
    expect(passwordForm).not.toContain('autoComplete="current-password"');
    expect(passwordForm).toContain("Crie uma senha forte e que você não use em outros serviços.");
    expect(security).toContain("updatePassword(data.newPassword)");
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

  it("migrates the existing address feature into the same account quality bar", () => {
    expect(accountRoutes).toContain("ACCOUNT_PATHS.addresses");
    expect(shell).toContain('label: "Endereços e território"');
    expect(preferences).toContain('hrefKey: "addresses"');
    expect(addresses).toContain("<AccountSettingsShell");
    expect(addresses).toContain('title="Endereços e território"');
    expect(addresses).toContain("<ResidenceManager />");
    expect(addresses).toContain("Seu endereço detalhado permanece privado");
    expect(addresses).toContain("Abrir Central profissional");
    expect(addresses).not.toContain("useAppUrls");
    expect(addresses).not.toContain("ArrowLeft");
  });

  it("preserves canonical notification and privacy service writes", () => {
    expect(notifications).toContain("NotificationPreferencesService.get()");
    expect(notifications).toContain("NotificationPreferencesService.patchAll(prefs)");
    expect(privacy).toContain("PrivacySettingsService.recordConsent");
    expect(privacy).toContain("PrivacySettingsService.exportUserData");
    expect(privacy).toContain("PrivacySettingsService.requestAccountDeletion");
    expect(privacy).toContain("PrivacySettingsService.cancelAccountDeletion");
  });

  it("keeps real consent history and the existing data-protection contact channel", () => {
    expect(privacy).toContain('location.hash === "#historico"');
    expect(privacy).toContain("PrivacySettingsService.getConsentHistory(user!.id)");
    expect(privacy).toContain("ConsentHistoryItem");
    expect(privacy).toContain("DATA_PROTECTION_CONTACT_PATH");
    expect(privacy).toContain("Falar sobre meus dados");
    expect(privacyService).toContain("static async getConsentHistory");
    expect(privacyService).toContain('order("created_at", { ascending: false })');
    expect(privacyService).toContain("revoked_at: row.revoked_at ?? null");
    expect(legal).toContain('DATA_PROTECTION_CONTACT_PATH = "/dpo"');
  });

  it("keeps the existing quiet-hours day scope editable instead of dropping it for concept fidelity", () => {
    expect(notifications).toContain("QUIET_DAY_OPTIONS");
    expect(notifications).toContain("quiet_hours_days");
    expect(notifications).toContain("toggleQuietDay");
    expect(notifications).toContain('aria-pressed={selected}');
    expect(notifications).toContain("Selecione pelo menos um dia");
    expect(notifications).toContain("quietDaysInvalid");
  });

  it("fails closed when consent, deletion or MFA authority cannot be loaded", () => {
    expect(privacy).toContain("consentsError");
    expect(privacy).toContain("deletionStatusLoading");
    expect(privacy).toContain("deletionStatusError");
    expect(privacy).toContain("Ações de exclusão ficam indisponíveis");
    expect(privacy).toContain("Suas escolhas não serão presumidas como desativadas");
    expect(privacy).toContain("!deletionStatusLoading && !deletionStatusError");
    expect(privacy).toContain("event.preventDefault()");
    expect(security).toContain("!isMFAStatusResolved");
    expect(security).toContain("Nenhuma nova configuração será criada enquanto o serviço de autenticação estiver indisponível.");
  });

  it("removes the duplicate legacy account-data dialog owner", () => {
    for (const legacySymbol of [
      "downloadDataOpen",
      "viewDataOpen",
      "deactivateOpen",
      "deleteConfirm",
      "handleDownloadData",
      "handleDeactivateAccount",
      "handleDeleteAccount",
    ]) {
      expect(workspace).not.toContain(legacySymbol);
      expect(profileHub).not.toContain(legacySymbol);
    }

    expect(existsSync(resolve(root, "src/modules/profile/components/DataManagementDialogs.tsx"))).toBe(false);
    expect(existsSync(resolve(root, "src/modules/profile/sections/SegurancaSection.tsx"))).toBe(false);
    expect(existsSync(resolve(root, "src/modules/profile/components/cards/SecurityActionCard.tsx"))).toBe(false);
  });

  it("exposes concept export and device states without inventing data", () => {
    expect(privacy).toContain('location.hash === "#exportar"');
    expect(privacy).toContain('title="Uma cópia dos seus dados"');
    expect(privacy).toContain('idPrefix="summary"');
    expect(privacy).toContain('idPrefix="mobile-details"');
    expect(privacy).toContain('idPrefix="desktop-details"');
    expect(push).toContain("usePush(user?.id)");
    expect(push).toContain("isSupported");
    expect(push).toContain("hasPermission");
    expect(push).toContain("isSubscribed");
  });

  it("scopes exclusive shell ownership to every migrated account route", () => {
    expect(appLayout).toContain("ACCOUNT_SETTINGS_SHELL_PATHS");
    expect(appLayout).toContain("accountUsesSettingsShell");
    expect(appLayout).toContain('id={accountUsesSettingsShell ? undefined : "main-content"}');
    expect(appLayout).toContain("conceptAccountPreview || accountUsesSettingsShell");
    expect(appLayout).toContain("accountUsesSettingsShell && !isAccountOverview");
    expect(accountRoutes).toContain("ACCOUNT_PATHS.addresses");
  });
});