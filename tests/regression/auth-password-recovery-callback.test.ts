import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("password recovery callback settlement", () => {
  it("keeps route intent separate from callback evidence and recovery authority", () => {
    const callback = read("src/core/auth/utils/authCallback.ts");
    const recovery = read("src/app/pages/ResetPasswordPage.tsx");

    expect(callback).toContain("export function isPasswordRecoveryRouteIntent");
    expect(callback).toContain("export function isPasswordRecoveryCallback");
    expect(callback).toContain("if (hasExplicitRecoveryType) return true;");
    expect(callback).toContain("if (!hasRecoveryMode) return false;");
    expect(callback).toContain("hasPendingAuthCallbackExchange(search, hash)");
    expect(callback).toContain("getAuthCallbackError(search, hash) !== null");
    expect(callback).toContain("const hasCompleteImplicitSession =");
    expect(callback).toContain(
      "return hasExplicitRecoveryType && hasCompleteImplicitSession;",
    );
    expect(callback).toContain("isPasswordRecoveryRouteIntent(search, hash)");

    expect(recovery).toContain("AuthService.onPasswordRecovery");
    expect(recovery).toContain("AuthService.updateRecoveredPassword");
    expect(recovery).not.toContain("hasPasswordRecoverySessionMarker");
    expect(recovery).not.toContain("hasPendingPkceCode");
    expect(recovery).not.toContain("hasRecoveryMarker");
  });

  it("replays a missed PKCE recovery event only from verified AMR claims", () => {
    const authority = read("src/core/auth/services/AuthRecoveryAuthority.ts");
    const authService = read("src/core/auth/services/AuthService.ts");

    expect(authority).toContain("supabase.auth.getClaims()");
    expect(authority).toContain('Reflect.get(entry, "method") === "recovery"');
    expect(authService).toContain(
      "AuthRecoveryAuthority.isCurrentSessionRecovery()",
    );

    const subscribe = authService.indexOf(
      "const unsubscribe = SessionService.onAuthStateChange",
    );
    const replay = authService.indexOf(
      "AuthRecoveryAuthority.isCurrentSessionRecovery()",
    );
    expect(subscribe).toBeGreaterThanOrEqual(0);
    expect(replay).toBeGreaterThan(subscribe);
  });

  it("keeps failed callbacks visible until the recovery page can reject them", () => {
    const client = read("src/integrations/supabase/supabase.ts");
    const recovery = read("src/app/pages/ResetPasswordPage.tsx");

    expect(client).toContain("detectSessionInUrl: true");
    expect(client).toContain('flowType: "pkce"');
    expect(client).not.toContain("cleanAuthReturnUrl");
    expect(client).not.toContain("hasAuthReturnParams");
    expect(recovery).toContain("AUTH_BROWSER_STORAGE_CONFIG.recoveryEventTimeoutMs");
    expect(recovery).toContain(
      'setView((current) => (current === "checking" ? "invalid" : current))',
    );
  });
});
