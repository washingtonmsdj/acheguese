import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("password recovery callback settlement", () => {
  it("does not treat route intent or a generic PKCE callback as recovery authority", () => {
    const callback = read("src/core/auth/utils/authCallback.ts");
    const recovery = read("src/app/pages/ResetPasswordPage.tsx");

    expect(callback).toContain("export function hasPendingPkceCode");
    expect(callback).toContain("const hasExplicitRecoveryType =");
    expect(callback).toContain("const hasCompleteImplicitSession =");
    expect(callback).toContain(
      "return hasExplicitRecoveryType && hasCompleteImplicitSession;",
    );
    expect(recovery).toContain("const liveSearch = window.location.search;");
    expect(recovery).toContain("const liveHash = window.location.hash;");
    expect(recovery).toContain(
      "hasPendingPkceCode as hasPendingPkceCodeInUrl",
    );
    expect(recovery).toContain(
      "const hasPendingPkceCode = hasPendingPkceCodeInUrl(liveSearch);",
    );
    expect(recovery).toContain(
      "if (user && hasRecoveryMarker && !hasPendingPkceCode)",
    );
    expect(recovery).not.toContain("if (user && hasRecoveryMarker) {");
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
