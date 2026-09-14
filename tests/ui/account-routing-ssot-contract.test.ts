import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const account = read("src/core/routing/config/account.ts");
const appUrls = read("src/core/routing/hooks/useAppUrls.ts");
const profileUrls = read("src/core/profiles/utils/publicProfileUrl.ts");

describe("account routing SSOT", () => {
  it("exposes every account-settings destination through ACCOUNT_PATHS", () => {
    for (const key of [
      "home",
      "profiles",
      "security",
      "access",
      "email",
      "password",
      "mfa",
      "notifications",
      "privacy",
      "exportData",
      "consentHistory",
      "preferences",
      "accessibility",
      "addresses",
      "profileSettings",
    ]) {
      expect(account).toContain(`${key}:`);
    }
  });

  it("reuses ACCOUNT_PATHS for profile-settings URL construction", () => {
    expect(profileUrls).toContain("import { ACCOUNT_PATHS }");
    expect(profileUrls).toContain("ACCOUNT_PATHS.profileSettings");
    expect(profileUrls).not.toContain('return tab ? `/conta/perfil/configuracoes');
  });

  it("keeps the app URL facade complete for concept settings flows", () => {
    for (const value of [
      "ACCOUNT_PATHS.addresses",
      "ACCOUNT_PATHS.preferences",
      "ACCOUNT_PATHS.accessibility",
      "ACCOUNT_PATHS.notifications",
      "ACCOUNT_PATHS.privacy",
      "ACCOUNT_PATHS.exportData",
      "ACCOUNT_PATHS.consentHistory",
      "ACCOUNT_PATHS.access",
      "ACCOUNT_PATHS.email",
      "ACCOUNT_PATHS.password",
      "ACCOUNT_PATHS.mfa",
    ]) {
      expect(appUrls).toContain(value);
    }
  });
});
