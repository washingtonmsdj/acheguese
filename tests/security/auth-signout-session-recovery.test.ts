import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const authService = read("src/core/auth/services/AuthService.ts");
const recovery = read("src/core/session/services/SessionSignOutRecovery.ts");

describe("auth sign-out session recovery", () => {
  it("reconciles the session owner when Supabase local sign-out fails or times out", () => {
    expect(authService).toContain("await AuthService.clearLocalAuthStorage();");
    expect(authService).toContain("recoverForcedLocalSignOut();");
    expect(authService.indexOf("await AuthService.clearLocalAuthStorage();")).toBeLessThan(
      authService.indexOf("recoverForcedLocalSignOut();"),
    );
  });

  it("clears every local session projection and re-arms the canonical listener", () => {
    expect(recovery).toContain("SessionService.cleanup();");
    expect(recovery).toContain("SessionState.clear();");
    expect(recovery).toContain("CacheManager.clearAll();");
    expect(recovery).toContain("ACTIVE_PROFILE_STORAGE_KEY");
    expect(recovery).toContain("window.localStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY)");
    expect(recovery).toContain("SessionService.initialize();");
    expect(recovery.indexOf("SessionService.cleanup();")).toBeLessThan(
      recovery.indexOf("SessionService.initialize();"),
    );
  });
});
