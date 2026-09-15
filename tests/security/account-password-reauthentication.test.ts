import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const authService = read("src/core/auth/services/AuthService.ts");
const authHook = read("src/core/auth/hooks/useAuth.ts");
const identityService = read("src/core/auth/services/AuthIdentityService.ts");
const securityPage = read("src/modules/profile/pages/ContaSegurancaPage.tsx");

describe("account password reauthentication", () => {
  it("keeps the Supabase nonce flow in the canonical auth owner", () => {
    expect(authService).toContain("supabase.auth.reauthenticate()");
    expect(authService).toContain("...(normalizedNonce ? { nonce: normalizedNonce } : {})");
    expect(authHook).toContain("requestPasswordReauthentication: () => Promise<void>");
    expect(authHook).toContain("updatePassword: (newPassword: string, nonce?: string) => Promise<void>");
  });

  it("requests reauthentication only when Supabase says the session needs it", () => {
    expect(securityPage).toContain('code === "reauthentication_needed"');
    expect(securityPage).toContain("await requestPasswordReauthCode()");
    expect(securityPage).toContain('code === "reauthentication_not_valid"');
    expect(securityPage).toContain("passwordReauthRequired ? passwordNonce.trim() : undefined");
    expect(securityPage).toContain('autoComplete="one-time-code"');
  });

  it("distinguishes an existing password identity from an OAuth-only account", () => {
    expect(identityService).toContain('hasPassword: providers.includes("email")');
    expect(securityPage).toContain("hasPassword ? \"Alterar senha\" : \"Criar senha\"");
    expect(securityPage).toContain("Nenhuma senha foi criada para esta conta.");
  });
});
