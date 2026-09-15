import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const authService = read("src/core/auth/services/AuthService.ts");
const authHook = read("src/core/auth/hooks/useAuth.ts");
const identityService = read("src/core/auth/services/AuthIdentityService.ts");
const securityPage = read("src/modules/profile/pages/ContaSegurancaPage.tsx");
const passwordForm = read("src/modules/profile/components/ChangePasswordForm.tsx");

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

  it("discards nonce state and invalidates late reauthentication requests when leaving the password view", () => {
    expect(securityPage).toContain("const passwordReauthRequestIdRef = useRef(0);");
    expect(securityPage).toContain("const currentLocationHashRef = useRef(location.hash);");
    expect(securityPage).toContain('if (location.hash === "#senha") return;');
    expect(securityPage).toContain("passwordReauthRequestIdRef.current += 1;");
    expect(securityPage).toContain('setPasswordNonce("");');
    expect(securityPage).toContain("setPasswordReauthRequired(false);");
    expect(securityPage).toContain("setPasswordReauthError(null);");
    expect(securityPage).toContain(
      'requestId !== passwordReauthRequestIdRef.current ||\n        currentLocationHashRef.current !== "#senha"',
    );
  });

  it("suppresses late password mutation UI effects after the user leaves the password view", () => {
    const updateCall = securityPage.indexOf("await updatePassword(");
    const firstRouteGuard = securityPage.indexOf(
      'if (currentLocationHashRef.current !== "#senha") return;',
      updateCall,
    );
    const successToast = securityPage.indexOf("toast.success(hasPassword", updateCall);
    const catchRouteGuard = securityPage.indexOf(
      'if (currentLocationHashRef.current !== "#senha") throw error;',
      updateCall,
    );

    expect(updateCall).toBeGreaterThanOrEqual(0);
    expect(firstRouteGuard).toBeGreaterThan(updateCall);
    expect(successToast).toBeGreaterThan(firstRouteGuard);
    expect(catchRouteGuard).toBeGreaterThan(successToast);
  });

  it("distinguishes an existing password method from an OAuth-only account", () => {
    expect(identityService).toContain("readMetadataProviders");
    expect(identityService).toContain("data.user.app_metadata ?? {}");
    expect(identityService).toContain('hasPassword: providers.includes("email")');
    expect(securityPage).toContain("hasPassword ? \"Alterar senha\" : \"Criar senha\"");
    expect(securityPage).toContain("Nenhuma senha foi criada para esta conta.");
  });

  it("keeps the password form wording valid for both creation and replacement", () => {
    expect(passwordForm).toContain("Defina uma nova senha");
    expect(passwordForm).toContain("Salvar nova senha");
    expect(passwordForm).not.toContain('"Alterar senha"');
  });
});
