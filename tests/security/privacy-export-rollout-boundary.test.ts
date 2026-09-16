import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const rollout = read("src/core/privacy/config/privacyRollout.ts");
const settingsService = read("src/core/privacy/services/PrivacySettingsService.ts");
const privacyService = read("src/core/privacy/services/PrivacyService.ts");
const privacyPage = read("src/app/pages/PrivacySettingsPage.tsx");
const exportFunction = read("supabase/functions/user-export-data/index.ts");
const productionEnv = read(".env.production");

describe("privacy data export rollout boundary", () => {
  it("keeps the uncertified export fail closed in source and production defaults", () => {
    expect(exportFunction).toContain(
      "const LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE = false;",
    );
    expect(rollout).toContain(
      "export const PRIVACY_DATA_EXPORT_RELEASE_CERTIFIED = false;",
    );
    expect(rollout).toContain(
      'import.meta.env.VITE_FEATURE_PRIVACY_DATA_EXPORT === "true"',
    );
    expect(productionEnv).toMatch(/^VITE_FEATURE_PRIVACY_DATA_EXPORT=false$/m);
  });

  it("blocks both browser export entrypoints before any network request", () => {
    const settingsGuard = settingsService.indexOf("assertPrivacyDataExportEnabled();");
    const settingsFetch = settingsService.indexOf(
      'fetch(buildSupabaseFunctionUrl("user-export-data")',
    );
    expect(settingsGuard).toBeGreaterThanOrEqual(0);
    expect(settingsFetch).toBeGreaterThan(settingsGuard);

    const legacyGuard = privacyService.indexOf("assertPrivacyDataExportEnabled();");
    const legacyInvoke = privacyService.indexOf(
      'supabase.functions.invoke("user-export-data")',
    );
    expect(legacyGuard).toBeGreaterThanOrEqual(0);
    expect(legacyInvoke).toBeGreaterThan(legacyGuard);
  });

  it("exposes availability from the same rollout authority", () => {
    expect(settingsService).toContain("static isUserDataExportAvailable(): boolean");
    expect(settingsService).toContain("return isPrivacyDataExportEnabled();");
  });

  it("makes the unavailable rollout explicit in the account privacy UI", () => {
    expect(privacyPage).toContain(
      "const exportAvailable = PrivacySettingsService.isUserDataExportAvailable();",
    );
    expect(privacyPage).toContain("if (!exportAvailable || isExporting) return;");
    expect(privacyPage).toContain("disabled={isExporting || !exportAvailable}");
    expect(privacyPage).toContain("Exportação temporariamente indisponível");
    expect(privacyPage).toContain("Solicitar meus dados à proteção de dados");
    expect(privacyPage).toContain("navigate(DATA_PROTECTION_CONTACT_PATH)");
  });
});
