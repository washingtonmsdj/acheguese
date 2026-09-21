import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (filePath: string) => fs.readFileSync(path.join(ROOT, filePath), "utf8");

describe("public root auth-return runtime boundary", () => {
  it("delegates root callback classification to the canonical auth utility", () => {
    const runtime = read("src/app/components/AppRuntime.tsx");

    expect(runtime).toContain(
      'import { hasAuthCallbackMarker } from "@/core/auth/utils/authCallback";',
    );
    expect(runtime).toContain("!hasAuthCallbackMarker(");
    expect(runtime).toContain("window.location.search");
    expect(runtime).toContain("window.location.hash");
    expect(runtime).not.toContain("function hasRootAuthReturnMarkers");
    expect(runtime).not.toContain("window.location.hash.length > 1");
  });

  it("keeps ordinary anchors distinct from real callback markers in the canonical utility", () => {
    const callback = read("src/core/auth/utils/authCallback.ts");

    expect(callback).toContain("export function hasAuthCallbackMarker(");
    expect(callback).toContain("searchParams.has(AUTH_QUERY_KEYS.code)");
    expect(callback).toContain("isPasswordRecoveryCallback(search, hash)");
    expect(callback).toContain("hashParams.has(AUTH_QUERY_KEYS.accessToken)");
    expect(callback).toContain("hashParams.has(AUTH_QUERY_KEYS.refreshToken)");
    expect(callback).toContain("getAuthCallbackError(search, hash) !== null");
  });

  it("keeps auth detection dependency-light on the lean bootstrap", () => {
    const runtime = read("src/app/components/AppRuntime.tsx");

    expect(runtime).not.toContain("AuthService");
    expect(runtime).not.toContain("@/integrations/supabase");
    expect(runtime).not.toContain("SessionService");
  });

  it("reuses canonical auth paths for public root account actions", () => {
    const entry = read("src/app/pages/TerritoryEntryPage.tsx");

    expect(entry).toContain("AUTH_PATHS");
    expect(entry).toContain("buildLoginPath");
    expect(entry).toContain('const ACCOUNT_PATH = "/conta";');
    expect(entry).toContain("buildLoginPath(ACCOUNT_PATH)");
    expect(entry).not.toContain('<a href="/login">');
    expect(entry).not.toContain('href="/cadastro"');
  });
});
