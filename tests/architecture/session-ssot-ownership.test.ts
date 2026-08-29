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

describe("G4 Auth/session SSOT ownership", () => {
  it("keeps runtime and security session services under the canonical session owner", () => {
    expect(fs.existsSync(projectPath("src/core/session/services/SessionService.ts"))).toBe(true);
    expect(
      fs.existsSync(projectPath("src/core/session/services/SessionSecurityService.ts")),
    ).toBe(true);

    expect(fs.existsSync(projectPath("src/core/auth/services/SessionService.ts"))).toBe(false);
    expect(fs.existsSync(projectPath("src/core/auth/hooks/useSessions.ts"))).toBe(false);
  });

  it("keeps the session security surface explicit on the canonical barrel", () => {
    const sessionIndex = read("src/core/session/index.ts");
    const servicesIndex = read("src/core/session/services/index.ts");

    expect(sessionIndex).toContain("SessionSecurityService");
    expect(sessionIndex).toContain("sessionSecurityService");
    expect(servicesIndex).toContain('export * from "./SessionSecurityService"');
  });

  it("keeps auth state consumers delegated to the canonical session state", () => {
    const useAuth = read("src/core/auth/hooks/useAuth.ts");
    const useSession = read("src/core/auth/hooks/useSession.ts");

    for (const source of [useAuth, useSession]) {
      expect(source).toContain("@/core/session/");
      expect(source).not.toContain("onAuthStateChange(");
    }
  });
});
