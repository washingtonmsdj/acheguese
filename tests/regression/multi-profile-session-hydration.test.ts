import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("multi-profile session hydration", () => {
  it("starts from the parent session user instead of serially re-awaiting session initialization", () => {
    const source = read(
      "src/core/profiles/contexts/multi-profile-runtime-context.tsx",
    );

    expect(source).toContain(
      "const { user: sessionUser, isLoading: sessionLoading } = useSessionContext();",
    );
    expect(source).toContain("const userId = sessionUser?.id ?? null;");
    expect(source).toContain("void loadProfilesForUser(userId);");
    expect(source).not.toContain("SessionService.initializeSession()");
    expect(source).not.toContain("SessionState.getState()");
    expect(source).not.toContain("@/core/session/state/SessionState");
  });

  it("discards stale profile reads and releases failed bootstrap attempts for retry", () => {
    const source = read(
      "src/core/profiles/contexts/multi-profile-runtime-context.tsx",
    );

    expect(source).toContain("const loadedUserIdRef = useRef<string | null>(null);");
    expect(source).toContain("const requestVersionRef = useRef(0);");
    expect(source).toContain("loadedUserIdRef.current = userId;");
    expect(source).toContain("const requestVersion = ++requestVersionRef.current;");
    expect(source).toContain("requestVersion !== requestVersionRef.current");
    expect(source).toContain("sessionUserIdRef.current !== userId");
    expect(source).toContain("if (loadedUserIdRef.current === userId) {");
    expect(source).toContain("loadedUserIdRef.current = null;");
    expect(source).toContain("requestVersionRef.current += 1;");
    expect(source).toContain("setContextualProfile(null);");
    expect(source).toContain("if (sessionLoading) return;");
  });

  it("clears the previous account projection before loading a different session user", () => {
    const source = read(
      "src/core/profiles/contexts/multi-profile-runtime-context.tsx",
    );

    expect(source).toContain(
      "const projectedUserIdRef = useRef<string | null>(null);",
    );
    expect(source).toContain(
      "const projectedUserId = projectedUserIdRef.current;",
    );
    expect(source).toContain(
      "if (projectedUserId !== null && projectedUserId !== userId) {",
    );
    expect(source).toContain("projectedUserIdRef.current = null;");
    expect(source).toContain("setAllProfiles([]);");
    expect(source).toContain("allProfilesRef.current = [];");
    expect(source).toContain("setActiveProfile(null);");
    expect(source).toContain("setContextualProfile(null);");
    expect(source).toContain("projectedUserIdRef.current = userId;");
  });

  it("does not erase the existing projection merely because the same user retries", () => {
    const source = read(
      "src/core/profiles/contexts/multi-profile-runtime-context.tsx",
    );
    const loadStart = source.indexOf(
      "const loadProfilesForUser = useCallback(async (userId: string) => {",
    );
    const crossAccountGuard = source.indexOf(
      "if (projectedUserId !== null && projectedUserId !== userId) {",
      loadStart,
    );
    const clearProfiles = source.indexOf("setAllProfiles([]);", crossAccountGuard);
    const fetchProfiles = source.indexOf(
      "await MultiProfileRuntimeService.getMyProfiles(userId);",
      clearProfiles,
    );

    expect(loadStart).toBeGreaterThanOrEqual(0);
    expect(crossAccountGuard).toBeGreaterThan(loadStart);
    expect(clearProfiles).toBeGreaterThan(crossAccountGuard);
    expect(fetchProfiles).toBeGreaterThan(clearProfiles);
    expect(source).not.toContain("if (loadedUserIdRef.current === userId) {\n      setAllProfiles([]);");
  });

  it("publishes profile-switch UI only while the same session user owns the operation", () => {
    const source = read(
      "src/core/profiles/contexts/multi-profile-runtime-context.tsx",
    );
    const switchStart = source.indexOf(
      "const switchProfile = useCallback(async (profileId: string): Promise<boolean> => {",
    );
    const ownerRead = source.indexOf(
      "const ownerUserId = sessionUser?.id ?? null;",
      switchStart,
    );
    const unsettledGuard = source.indexOf(
      "sessionUserIdRef.current !== ownerUserId",
      ownerRead,
    );
    const profileOwnership = source.indexOf(
      "candidate.user_id === ownerUserId",
      unsettledGuard,
    );
    const serviceCall = source.indexOf(
      "await SessionService.switchProfile(profileId);",
      profileOwnership,
    );
    const staleGuard = source.indexOf(
      "ownerVersion !== sessionOwnerVersionRef.current",
      serviceCall,
    );
    const publishActive = source.indexOf("setActiveProfile(profile);", staleGuard);

    expect(source).toContain(
      "const sessionUserIdRef = useRef<string | null>(sessionUser?.id ?? null);",
    );
    expect(source).toContain("const sessionOwnerVersionRef = useRef(0);");
    expect(source).toContain("sessionOwnerVersionRef.current += 1;");
    expect(switchStart).toBeGreaterThanOrEqual(0);
    expect(ownerRead).toBeGreaterThan(switchStart);
    expect(unsettledGuard).toBeGreaterThan(ownerRead);
    expect(profileOwnership).toBeGreaterThan(unsettledGuard);
    expect(serviceCall).toBeGreaterThan(profileOwnership);
    expect(staleGuard).toBeGreaterThan(serviceCall);
    expect(publishActive).toBeGreaterThan(staleGuard);
  });

  it("leaves switch persistence to SessionService instead of writing it twice", () => {
    const source = read(
      "src/core/profiles/contexts/multi-profile-runtime-context.tsx",
    );
    const switchStart = source.indexOf(
      "const switchProfile = useCallback(async (profileId: string): Promise<boolean> => {",
    );
    const switchEnd = source.indexOf(
      "const setModuleContext = useCallback",
      switchStart,
    );
    const switchBlock = source.slice(switchStart, switchEnd);

    expect(switchBlock).toContain("await SessionService.switchProfile(profileId);");
    expect(switchBlock).not.toContain("writeStoredActiveProfileId(profileId)");
  });

  it("invalidates profile async work on provider unmount", () => {
    const source = read(
      "src/core/profiles/contexts/multi-profile-runtime-context.tsx",
    );

    expect(source).toContain("const mountedRef = useRef(true);");
    expect(source).toContain("mountedRef.current = false;");
    expect(source).toContain("sessionOwnerVersionRef.current += 1;");
    expect(source).toContain("requestVersionRef.current += 1;");
  });

  it("keeps profile persistence resilient without creating another storage key", () => {
    const source = read(
      "src/core/profiles/contexts/multi-profile-runtime-context.tsx",
    );

    expect(source).toContain("ACTIVE_PROFILE_STORAGE_KEY");
    expect(source).toContain("readStoredActiveProfileId");
    expect(source).toContain("writeStoredActiveProfileId");
    expect(source).toContain("clearStoredActiveProfileId");
    expect(source).not.toMatch(/localStorage\.(?:getItem|setItem|removeItem)\(["'][^"']+["']/);
  });
});
