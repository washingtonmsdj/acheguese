import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function projectPath(relativePath: string): string {
  return path.join(ROOT, relativePath);
}

function read(relativePath: string): string {
  return fs.readFileSync(projectPath(relativePath), "utf8");
}

function walkSource(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkSource(absolute));
      continue;
    }
    if (entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name)) files.push(absolute);
  }
  return files;
}

describe("G4 Auth/session SSOT ownership", () => {
  it("keeps one runtime session owner and retires the legacy security facade", () => {
    expect(fs.existsSync(projectPath("src/core/session/services/SessionService.ts"))).toBe(true);
    expect(
      fs.existsSync(projectPath("src/core/session/services/SessionSecurityService.ts")),
    ).toBe(false);

    expect(fs.existsSync(projectPath("src/core/auth/services/SessionService.ts"))).toBe(false);
    expect(fs.existsSync(projectPath("src/core/auth/hooks/useSessions.ts"))).toBe(false);
  });

  it("keeps legacy session trackers outside core/session runtime", () => {
    const sessionRoot = projectPath("src/core/session");
    const offenders = walkSource(sessionRoot)
      .filter((filePath) =>
        /user_sessions|session_anomalies/.test(fs.readFileSync(filePath, "utf8")),
      )
      .map((filePath) => path.relative(ROOT, filePath).replace(/\\/g, "/"));

    expect(offenders).toEqual([]);
  });

  it("retires parallel auth hooks for session/profile runtime state", () => {
    for (const retiredPath of [
      "src/core/auth/hooks/useSession.ts",
      "src/core/auth/hooks/useUser.ts",
      "src/core/auth/hooks/useProfileContextIntegration.ts",
    ]) {
      expect(fs.existsSync(projectPath(retiredPath)), retiredPath).toBe(false);
    }

    const authHooks = read("src/core/auth/hooks/index.ts");
    const authIndex = read("src/core/auth/index.ts");
    expect(authHooks).toContain('export { useAuth } from "./useAuth"');
    expect(authHooks).not.toContain("useSession");
    expect(authHooks).not.toContain("useUser");
    expect(authIndex).not.toContain("useSession");
    expect(authIndex).not.toContain("useUser");
  });

  it("derives auth identity from the canonical session user contract", () => {
    const authTypes = read("src/core/auth/services/types.ts");
    const authServices = read("src/core/auth/services/index.ts");
    const authIndex = read("src/core/auth/index.ts");

    expect(authTypes).toContain('import type { User as SessionUser } from "@/core/session/types"');
    expect(authTypes).toContain("export type AuthUser = Pick<");
    expect(authTypes).not.toContain("interface AuthSession");
    expect(authTypes).not.toContain("interface AuthResult");
    expect(authServices).not.toContain("AuthSession");
    expect(authServices).not.toContain("AuthResult");
    expect(authIndex).not.toContain("AuthSession");
    expect(authIndex).not.toContain("AuthResult");
  });

  it("does not re-export the retired session security facade", () => {
    const sessionIndex = read("src/core/session/index.ts");
    const servicesIndex = read("src/core/session/services/index.ts");

    expect(sessionIndex).not.toContain("SessionSecurityService");
    expect(sessionIndex).not.toContain("sessionSecurityService");
    expect(servicesIndex).not.toContain("SessionSecurityService");
  });

  it("keeps the public auth hook delegated to the canonical session state", () => {
    const useAuth = read("src/core/auth/hooks/useAuth.ts");

    expect(useAuth).toContain("@/core/session/");
    expect(useAuth).not.toContain("onAuthStateChange(");
  });

  it("invalidates queued auth work before stale sessions can republish after sign-out", () => {
    const sessionService = read("src/core/session/services/SessionService.ts");

    expect(sessionService).toContain("private static authEventVersion = 0;");
    expect(sessionService).toContain(
      "const eventVersion = ++SessionService.authEventVersion;",
    );
    expect(sessionService).toContain(
      "eventVersion !== SessionService.authEventVersion",
    );
    expect(sessionService).toContain("!SessionService.ownsSession(session)");
    expect(sessionService).toContain("SessionService.cancelPendingLoads();");
    expect(sessionService).toContain("SessionState.clear();");
  });

  it("prevents stale getSession and load promises from stealing newer ownership", () => {
    const sessionService = read("src/core/session/services/SessionService.ts");

    expect(sessionService).toContain(
      "const requestVersion = SessionService.authEventVersion;",
    );
    expect(sessionService).toContain(
      "requestVersion !== SessionService.authEventVersion",
    );
    expect(sessionService).toContain(
      "SessionService.currentSessionPromise === sessionPromise",
    );
    expect(sessionService).toContain(
      "SessionService.loadPromise === loadPromise",
    );
    expect(sessionService).toContain(
      "const loadPromise = SessionService.doLoad(session)",
    );
  });

  it("keeps session hydration fresh-only instead of reviving the retired session cache read", () => {
    const sessionService = read("src/core/session/services/SessionService.ts");

    expect(sessionService).not.toContain("forceFresh");
    expect(sessionService).not.toContain("CacheManager.getSession()");
    expect(sessionService).not.toContain("CacheManager.setSession(");
    expect(sessionService).toContain(
      "private static async loadFromSession(session: Session): Promise<void>",
    );
  });

  it("keeps CacheManager as an invalidation bus instead of a second SessionData store", () => {
    const cacheManager = read("src/core/session/cache/CacheManager.ts");
    const cacheConfig = read("src/core/session/cache/CacheConfig.ts");

    expect(cacheManager).toContain("registerInvalidationCallback");
    expect(cacheManager).toContain("notifyInvalidation");
    expect(cacheManager).toContain('CacheManager.notifyInvalidation("session")');
    expect(cacheManager).toContain('CacheManager.notifyInvalidation("all")');
    expect(cacheManager).not.toContain("SessionData");
    expect(cacheManager).not.toContain("sessionCache");
    expect(cacheManager).not.toContain("getSession()");
    expect(cacheManager).not.toContain("setSession(");
    expect(cacheManager).not.toContain("getMetrics()");
    expect(cacheConfig).not.toContain("session: { ttl:");
    expect(cacheConfig).toContain("authorization: { ttl: number }");
  });

  it("uses a strict private-profile reader for canonical session hydration", () => {
    const sessionService = read("src/core/session/services/SessionService.ts");
    const strictReader = read(
      "src/core/profiles/services/SessionProfileReader.ts",
    );

    expect(sessionService).toContain(
      '"@/core/profiles/services/SessionProfileReader"',
    );
    expect(sessionService).toContain(
      "await SessionProfileReader.getProfilesByUserId(userId);",
    );
    expect(sessionService).toContain("throw error;");
    expect(strictReader).toContain(
      "ProfileRpcService.getAccessibleProfiles<ProfileRow[]>",
    );
    expect(strictReader).toContain("targetUserId: userId");
    expect(strictReader).not.toContain("catch (");
    expect(strictReader).not.toContain("return []");
  });

  it("preserves a same-user profile projection while a fresh refresh is pending", () => {
    const sessionService = read("src/core/session/services/SessionService.ts");

    expect(sessionService).toContain(
      "const previousState = SessionState.getState();",
    );
    expect(sessionService).toContain(
      "const preserveExistingProjection = previousState.user?.id === user.id;",
    );
    expect(sessionService).toContain(
      "activeProfile: preserveExistingProjection ? previousState.activeProfile : null",
    );
    expect(sessionService).toContain(
      "profiles: preserveExistingProjection ? previousState.profiles : []",
    );
  });

  it("serializes profile switches and revalidates the owning session around the RPC", () => {
    const sessionService = read("src/core/session/services/SessionService.ts");
    const handler = sessionService.indexOf(
      "private static async performProfileSwitch(",
    );
    const firstOwnership = sessionService.indexOf(
      "SessionService.assertSessionOwnership(session, eventVersion);",
      handler,
    );
    const rpc = sessionService.indexOf(
      "await SessionRpcService.switchActiveProfile(profileId);",
      firstOwnership,
    );
    const secondOwnership = sessionService.indexOf(
      "SessionService.assertSessionOwnership(session, eventVersion);",
      firstOwnership + 1,
    );
    const localWrite = sessionService.indexOf(
      "SessionService.setStoredActiveProfileId(profileId);",
      secondOwnership,
    );

    expect(sessionService).toContain(
      "private static profileSwitchQueue: Promise<void> = Promise.resolve();",
    );
    expect(sessionService).toContain(
      "const eventVersion = SessionService.authEventVersion;",
    );
    expect(sessionService).toContain("SessionService.profileSwitchQueue");
    expect(firstOwnership).toBeGreaterThan(handler);
    expect(rpc).toBeGreaterThan(firstOwnership);
    expect(secondOwnership).toBeGreaterThan(rpc);
    expect(localWrite).toBeGreaterThan(secondOwnership);
  });

  it("does not turn confirmed profile switches into false failures when only refresh fails", () => {
    const sessionService = read("src/core/session/services/SessionService.ts");
    const handler = sessionService.indexOf(
      "private static async performProfileSwitch(",
    );
    const switchRpc = sessionService.indexOf(
      "await SessionRpcService.switchActiveProfile(profileId);",
      handler,
    );
    const refreshTry = sessionService.indexOf("try {", switchRpc);
    const refresh = sessionService.indexOf(
      "await SessionService.loadFromSession(session);",
      refreshTry,
    );
    const deferredWarning = sessionService.indexOf(
      "SessionService profile refresh deferred after successful switch",
      refresh,
    );

    expect(switchRpc).toBeGreaterThan(handler);
    expect(refreshTry).toBeGreaterThan(switchRpc);
    expect(refresh).toBeGreaterThan(refreshTry);
    expect(deferredWarning).toBeGreaterThan(refresh);
  });
});
