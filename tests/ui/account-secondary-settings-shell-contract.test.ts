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
    expect(profileSettings).toContain("backTo={ACCOUNT_PATHS.preferences}");
  });

  it("keeps identity settings visually anchored to Preferences", () => {
    expect(shell).toContain("extraPaths?: readonly string[]");
    expect(shell).toContain("extraPaths: [ACCOUNT_PATHS.profileSettings]");
    expect(shell).toContain("extraPaths?.includes(pathname)");
    expect(shell).toContain("pathname === ACCOUNT_PATHS.profileSettings");
    expect(shell).toContain("return ACCOUNT_PATHS.preferences");
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
