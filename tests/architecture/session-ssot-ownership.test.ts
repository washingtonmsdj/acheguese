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

  it("keeps the session security surface explicit on the canonical barrel", () => {
    const sessionIndex = read("src/core/session/index.ts");
    const servicesIndex = read("src/core/session/services/index.ts");

    expect(sessionIndex).toContain("SessionSecurityService");
    expect(sessionIndex).toContain("sessionSecurityService");
    expect(servicesIndex).toContain('export * from "./SessionSecurityService"');
  });

  it("keeps the public auth hook delegated to the canonical session state", () => {
    const useAuth = read("src/core/auth/hooks/useAuth.ts");

    expect(useAuth).toContain("@/core/session/");
    expect(useAuth).not.toContain("onAuthStateChange(");
  });
});
