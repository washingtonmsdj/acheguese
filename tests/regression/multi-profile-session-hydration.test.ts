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

  it("discards stale profile reads when the session user changes or signs out", () => {
    const source = read(
      "src/core/profiles/contexts/multi-profile-runtime-context.tsx",
    );

    expect(source).toContain("const loadedUserIdRef = useRef<string | null>(null);");
    expect(source).toContain("const requestVersionRef = useRef(0);");
    expect(source).toContain("const requestVersion = ++requestVersionRef.current;");
    expect(source).toContain("if (requestVersion !== requestVersionRef.current) return;");
    expect(source).toContain("requestVersionRef.current += 1;");
    expect(source).toContain("setContextualProfile(null);");
    expect(source).toContain("if (sessionLoading) return;");
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
