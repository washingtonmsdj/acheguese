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

  it("keeps shared auth loading true until every overlapping operation has finished", () => {
    expect(authHook).toContain("const activeOperationsRef = useRef(0);");
    expect(authHook).toContain("activeOperationsRef.current += 1;");
    expect(authHook).toContain(
      "if (activeOperationsRef.current === 1) setLoading(true);",
    );
    expect(authHook).toContain(
      "activeOperationsRef.current = Math.max(0, activeOperationsRef.current - 1);",
    );
    expect(authHook).toContain(
      "if (activeOperationsRef.current === 0) setLoading(false);",
    );
    expect(authHook).toContain("beginAuthOperation();");
    expect(authHook).toContain("endAuthOperation();");
  });

  it("requests reauthentication only when Supabase says the session needs it", () => {
    expect(securityPage).toContain('code === "reauthentication_needed"');
    expect(securityPage).toContain("await requestPasswordReauthCode()");
    expect(securityPage).toContain('code === "reauthentication_not_valid"');
    expect(securityPage).toContain("passwordReauthRequired ? passwordNonce.trim() : undefined");
    expect(securityPage).toContain('autoComplete="one-time-code"');
  });

  it("deduplicates simultaneous reauthentication-code requests", () => {
    const handler = authHook.indexOf(
      "const requestPasswordReauthentication = useCallback(async () => {",
    );
    const activeRead = authHook.indexOf(
      "const activeRequest = passwordReauthInFlightRef.current;",
      handler,
    );
    const reuse = authHook.indexOf("if (activeRequest) return activeRequest;", activeRead);
    const request = authHook.indexOf(
      "await AuthService.requestPasswordReauthentication();",
      reuse,
    );
    const register = authHook.indexOf(
      "passwordReauthInFlightRef.current = operation;",
      request,
    );
    const release = authHook.indexOf(
      "passwordReauthInFlightRef.current = null;",
      register,
    );

    expect(authHook).toContain(
      "const passwordReauthInFlightRef = useRef<Promise<void> | null>(null);",
    );
    expect(handler).toBeGreaterThanOrEqual(0);
    expect(activeRead).toBeGreaterThan(handler);
    expect(reuse).toBeGreaterThan(activeRead);
    expect(request).toBeGreaterThan(reuse);
    expect(register).toBeGreaterThan(request);
    expect(release).toBeGreaterThan(register);
  });

  it("deduplicates simultaneous revocation of other sessions", () => {
    const handler = authHook.indexOf(
      "const signOutOtherSessions = useCallback(async () => {",
    );
    const activeRead = authHook.indexOf(
      "const activeRevocation = signOutOthersInFlightRef.current;",
      handler,
    );
    const reuse = authHook.indexOf(
      "if (activeRevocation) return activeRevocation;",
      activeRead,
    );
    const revoke = authHook.indexOf(
      "await AuthService.signOutOtherSessions();",
      reuse,
    );
    const register = authHook.indexOf(
      "signOutOthersInFlightRef.current = operation;",
      revoke,
    );
    const release = authHook.indexOf(
      "signOutOthersInFlightRef.current = null;",
      register,
    );

    expect(authHook).toContain(
      "const signOutOthersInFlightRef = useRef<Promise<void> | null>(null);",
    );
    expect(handler).toBeGreaterThanOrEqual(0);
    expect(activeRead).toBeGreaterThan(handler);
    expect(reuse).toBeGreaterThan(activeRead);
    expect(revoke).toBeGreaterThan(reuse);
    expect(register).toBeGreaterThan(revoke);
    expect(release).toBeGreaterThan(register);
  });

  it("discards nonce state and invalidates late reauthentication requests when leaving the password view", () => {
    expect(securityPage).toContain("const passwordReauthRequestIdRef = useRef(0);");
    expect(securityPage).toContain('if (location.hash === "#senha") return;');
    expect(securityPage).toContain("passwordReauthRequestIdRef.current += 1;");
    expect(securityPage).toContain('setPasswordNonce("");');
    expect(securityPage).toContain("setPasswordReauthRequired(false);");
    expect(securityPage).toContain("setPasswordReauthError(null);");
    expect(securityPage).toContain('!isCurrentSecurityView("#senha")');
  });

  it("invalidates the password request generation when the whole security page unmounts", () => {
    expect(securityPage).toContain("const mountedRef = useRef(true);");
    expect(securityPage).toContain("mountedRef.current = false;");
    expect(securityPage).toContain("passwordReauthRequestIdRef.current += 1;");
    expect(securityPage).toContain(
      "currentLocationPathRef.current === ACCOUNT_PATHS.security",
    );
    expect(securityPage).toContain(
      "const isCurrentSecurityView = (hash: string) =>",
    );
  });

  it("suppresses late password mutation UI effects after the user leaves the password view", () => {
    const updateCall = securityPage.indexOf("await updatePassword(");
    const firstRouteGuard = securityPage.indexOf(
      'if (!isCurrentSecurityView("#senha")) return;',
      updateCall,
    );
    const successToast = securityPage.indexOf("toast.success(hasPassword", updateCall);
    const catchRouteGuard = securityPage.indexOf(
      'if (!isCurrentSecurityView("#senha")) throw error;',
      updateCall,
    );

    expect(updateCall).toBeGreaterThanOrEqual(0);
    expect(firstRouteGuard).toBeGreaterThan(updateCall);
    expect(successToast).toBeGreaterThan(firstRouteGuard);
    expect(catchRouteGuard).toBeGreaterThan(successToast);
  });

  it("serializes password form submissions before React Hook Form busy state settles", () => {
    const handler = passwordForm.indexOf(
      "const onValid = async (data: ResetPasswordFormInput) => {",
    );
    const lockGuard = passwordForm.indexOf("if (saveInFlight.current) return;", handler);
    const acquire = passwordForm.indexOf("saveInFlight.current = true;", lockGuard);
    const save = passwordForm.indexOf("await onSave(data);", acquire);
    const release = passwordForm.indexOf("saveInFlight.current = false;", save);

    expect(passwordForm).toContain("const saveInFlight = useRef(false);");
    expect(handler).toBeGreaterThanOrEqual(0);
    expect(lockGuard).toBeGreaterThan(handler);
    expect(acquire).toBeGreaterThan(lockGuard);
    expect(save).toBeGreaterThan(acquire);
    expect(release).toBeGreaterThan(save);
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
