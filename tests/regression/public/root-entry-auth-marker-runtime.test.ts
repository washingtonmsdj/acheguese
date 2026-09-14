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

  it("keeps real PKCE, recovery and hash-error markers on the full runtime", () => {
    const runtime = read("src/app/components/AppRuntime.tsx");

    expect(runtime).toContain('searchParams.has("code")');
    expect(runtime).toContain('searchParams.get("mode") === "recovery"');
    expect(runtime).toContain('searchParams.get("type") === "recovery"');
    expect(runtime).toContain('hashParams.has("access_token")');
    expect(runtime).toContain('hashParams.has("refresh_token")');
    expect(runtime).toContain('hashParams.has("error")');
    expect(runtime).toContain('hashParams.has("error_code")');
    expect(runtime).toContain('hashParams.get("type") === "recovery"');
    expect(runtime).toContain("return !hasRootAuthReturnMarkers();");
  });

  it("keeps auth detection dependency-free on the lean bootstrap", () => {
    const runtime = read("src/app/components/AppRuntime.tsx");

    expect(runtime).not.toContain("AuthService");
    expect(runtime).not.toContain("@/integrations/supabase");
    expect(runtime).not.toContain("SessionService");
  });
});
