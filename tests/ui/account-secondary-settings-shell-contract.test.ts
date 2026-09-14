import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const accountRoutes = read("src/core/routing/config/account.ts");
const shell = read("src/modules/profile/components/AccountSettingsShell.tsx");
const profileSettings = read("src/app/pages/ProfileSettingsPage.tsx");
const addresses = read("src/modules/profile/pages/ContaEnderecosPage.tsx");
const preferences = read("src/modules/profile/pages/ContaPreferenciasPage.tsx");

describe("secondary account settings shell contract", () => {
  it("keeps existing secondary account surfaces inside the canonical shell", () => {
    expect(accountRoutes).toContain("ACCOUNT_PATHS.addresses");
    expect(accountRoutes).toContain("ACCOUNT_PATHS.profileSettings");
    expect(addresses).toContain("<AccountSettingsShell");
    expect(profileSettings).toContain("<AccountSettingsShell");
    expect(addresses).toContain("backTo={ACCOUNT_PATHS.preferences}");
    expect(profileSettings).toContain("backTo={ACCOUNT_PATHS.preferences}");
  });

  it("keeps identity settings visually anchored to Preferences", () => {
    expect(shell).toContain("extraPaths?: readonly string[]");
    expect(shell).toContain("extraPaths: [ACCOUNT_PATHS.profileSettings]");
    expect(shell).toContain("extraPaths?.includes(pathname)");
    expect(shell).toContain("pathname === ACCOUNT_PATHS.profileSettings");
    expect(shell).toContain("return ACCOUNT_PATHS.preferences");
  });

  it("uses the mobile viewport owned by each account shell without phantom navigation space", () => {
    expect(shell).toContain("const hasMobileAccountNav = location.pathname === ACCOUNT_PATHS.home");
    expect(shell).toContain('"pb-[calc(env(safe-area-inset-bottom)+6rem)]"');
    expect(shell).toContain('"pb-[calc(env(safe-area-inset-bottom)+2rem)]"');
    expect(shell).toContain("sticky top-0 z-30");
    expect(shell).toContain("bg-territory-surface/95");
    expect(shell).toContain("backdrop-blur");
  });

  it("names mobile back controls by their real parent destination", () => {
    expect(shell).toContain("resolveBackLabel");
    expect(shell).toContain('"Voltar para Dados de acesso"');
    expect(shell).toContain('"Voltar para Segurança"');
    expect(shell).toContain('"Voltar para Privacidade e dados"');
    expect(shell).toContain('"Voltar para Preferências"');
    expect(shell).toContain('"Voltar para Minha conta"');
    expect(shell).toContain("aria-label={backLabel}");
  });

  it("preserves real identity-management capabilities after the visual migration", () => {
    expect(profileSettings).toContain("<PrivacySettings profile={activeProfile}");
    expect(profileSettings).toContain("<ProfileLinksManager profileId={activeProfile.id}");
    expect(profileSettings).toContain("<ProfileMembersManagerImproved");
    expect(profileSettings).toContain("canProfileHaveMembers(activeProfile)");
    expect(profileSettings).toContain('value="privacy"');
    expect(profileSettings).toContain('value="links"');
    expect(profileSettings).toContain('value="members"');
    expect(profileSettings).toContain("Vínculos");
    expect(profileSettings).not.toContain("Vinculos Vínculos");
    expect(profileSettings).not.toContain("ArrowLeft");
    expect(profileSettings).not.toContain("useAppUrls");
  });

  it("keeps addresses discoverable without mixing private residence with professional coverage", () => {
    expect(preferences).toContain('title: "Endereços e território"');
    expect(preferences).toContain('hrefKey: "addresses"');
    expect(addresses).toContain("<ResidenceManager />");
    expect(addresses).toContain("Seu endereço detalhado permanece privado");
    expect(addresses).toContain("Cobertura profissional");
    expect(addresses).toContain("Abrir Central profissional");
  });
});
