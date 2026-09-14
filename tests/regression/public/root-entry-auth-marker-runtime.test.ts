import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (filePath: string) => fs.readFileSync(path.join(ROOT, filePath), "utf8");

describe("public root auth-return runtime boundary", () => {
  it("does not treat every root hash anchor as an auth callback", () => {
    const runtime = read("src/app/components/AppRuntime.tsx");

    expect(runtime).toContain("function hasRootAuthReturnMarkers(): boolean");
    expect(runtime).toContain('window.location.hash.replace(/^#/, "")');
    expect(runtime).not.toContain("window.location.hash.length > 1");
  });

  it("keeps real PKCE, recovery and hash-error markers on the full runtime through the auth SSOT", () => {
    const runtime = read("src/app/components/AppRuntime.tsx");
    const authFlow = read("src/core/auth/constants/authFlow.ts");

    expect(runtime).toContain(
      'import { AUTH_QUERY_KEYS } from "@/core/auth/constants/authFlow";',
    );
    expect(runtime).toContain("searchParams.has(AUTH_QUERY_KEYS.code)");
    expect(runtime).toContain(
      'searchParams.get(AUTH_QUERY_KEYS.mode) === "recovery"',
    );
    expect(runtime).toContain(
      'searchParams.get(AUTH_QUERY_KEYS.type) === "recovery"',
    );
    expect(runtime).toContain("hashParams.has(AUTH_QUERY_KEYS.accessToken)");
    expect(runtime).toContain("hashParams.has(AUTH_QUERY_KEYS.refreshToken)");
    expect(runtime).toContain("hashParams.has(AUTH_QUERY_KEYS.error)");
    expect(runtime).toContain("hashParams.has(AUTH_QUERY_KEYS.errorCode)");
    expect(runtime).toContain(
      'hashParams.get(AUTH_QUERY_KEYS.type) === "recovery"',
    );
    expect(runtime).toContain("return !hasRootAuthReturnMarkers();");

    expect(authFlow).toContain('accessToken: "access_token"');
    expect(authFlow).toContain('refreshToken: "refresh_token"');
  });

  it("keeps auth detection dependency-light on the lean bootstrap", () => {
    const runtime = read("src/app/components/AppRuntime.tsx");

    expect(runtime).not.toContain("AuthService");
    expect(runtime).not.toContain("@/integrations/supabase");
    expect(runtime).not.toContain("SessionService");
  });

  it("reuses canonical auth paths for public root account actions", () => {
    const entry = read("src/app/pages/TerritoryEntryPage.tsx");

    expect(entry).toContain(
      'import { AUTH_PATHS } from "@/core/auth/constants/authFlow";',
    );
    expect(entry).toContain("href={AUTH_PATHS.login}");
    expect(entry).toContain("href={AUTH_PATHS.signup}");
    expect(entry).not.toContain('<a href="/login">');
    expect(entry).not.toContain('href="/cadastro"');
  });
});
