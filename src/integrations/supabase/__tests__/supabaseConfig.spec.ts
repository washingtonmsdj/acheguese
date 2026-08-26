import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { AUTH_STORAGE_KEY } from "@/shared/config/security.config";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("supabase auth config", () => {
  it("uses a namespaced storage key instead of the generic token lock", () => {
    const source = readProjectFile("src/integrations/supabase/supabase.ts");

    expect(AUTH_STORAGE_KEY).not.toBe("token");
    expect(source).toContain("storageKey: AUTH_STORAGE_KEY");
    expect(source).not.toContain("storageKey: 'token'");
  });

  it("uses PKCE with the centralized cookie-only auth storage", () => {
    const source = readProjectFile("src/integrations/supabase/supabase.ts");

    expect(source).toContain("createBrowserAuthStorage()");
    expect(source).toContain('flowType: "pkce"');
    expect(source).not.toContain('flowType: "implicit"');
    expect(source).not.toContain("localStorage fallback");
  });
});
