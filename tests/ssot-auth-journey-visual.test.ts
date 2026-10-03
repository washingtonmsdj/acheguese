import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const FILES = [
  "src/app/features/onboarding/pages/CadastroConfirmacaoPage.tsx",
  "src/app/features/onboarding/pages/AceiteTermosPage.tsx",
  "src/app/features/onboarding/pages/CadastroPrimeiroAcessoPage.tsx",
  "src/app/pages/ResetPasswordPage.tsx",
  "src/app/pages/EmailChangeConfirmationPage.tsx",
] as const;
const FORBIDDEN = [
  "text-primary",
  "bg-primary",
  "text-primary-foreground",
  "text-foreground",
  "text-muted-foreground",
  "border-border",
  "border-input",
  "bg-background",
  "bg-card",
  "bg-muted",
] as const;

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("auth journey territory visual SSOT", () => {
  it("projects all remaining account-entry surfaces through territory tokens", () => {
    for (const file of FILES) {
      const source = read(file);
      expect(source, file).toContain("auth-concept-canvas");
      expect(source, file).toContain("territory-");
      for (const legacy of FORBIDDEN) {
        expect(source, `${file} still contains ${legacy}`).not.toContain(legacy);
      }
    }
  });

  it("preserves the real auth and account contracts while changing presentation", () => {
    expect(read(FILES[0])).toContain("resendConfirmationEmail");
    expect(read(FILES[0])).toContain("AuthTurnstileGate");
    expect(read(FILES[1])).toContain("PrivacySettingsService.recordConsent");
    expect(read(FILES[1])).toContain("TERMS_OF_SERVICE_VERSION");
    expect(read(FILES[2])).toContain("profileService.getRequiredActiveProfile");
    expect(read(FILES[2])).toContain("profileService.updateProfile");
    expect(read(FILES[3])).toContain("AuthService.updateRecoveredPassword");
    expect(read(FILES[3])).toContain("checkPasswordCompromise");
    expect(read(FILES[4])).toContain("hasPendingAuthCallbackExchange");
    expect(read(FILES[4])).toContain("ACCOUNT_PATHS.access");
  });
});
