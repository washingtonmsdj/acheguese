import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("public home auth CTA", () => {
  it("reflects the canonical session without bypassing the terms gate", () => {
    const entry = readProjectFile("src/app/pages/TerritoryEntryPage.tsx");

    expect(entry).toContain(
      'import("@/core/session/services/SessionService")',
    );
    expect(entry).toContain("SessionService.onAuthStateChange");
    expect(entry).toContain("SessionService.getCurrentUser()");
    expect(entry).not.toContain("supabase.auth.");

    expect(entry).toContain('const ACCOUNT_PATH = "/conta";');
    expect(entry).toContain("buildLoginPath(ACCOUNT_PATH)");
    expect(entry).toContain('isAuthenticated ? "Minha conta" : "Entrar"');
    expect(entry).toContain('isAuthenticated ? "Minha conta"');
    expect(entry).not.toContain('href="/login"');
    expect(entry).not.toContain('href="/cadastro"');
  });
});
