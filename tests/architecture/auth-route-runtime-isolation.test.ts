import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const shell = readFileSync(
  resolve(root, "src/app/components/SessionProfileRuntimeShell.tsx"),
  "utf8",
);

describe("auth route runtime isolation", () => {
  it("keeps public auth routes on session-only runtime", () => {
    for (const pathOwner of [
      "AUTH_PATHS.login",
      "AUTH_PATHS.signup",
      "AUTH_PATHS.signupConfirmation",
      "AUTH_PATHS.termsAcceptance",
      "AUTH_PATHS.passwordReset",
      "AUTH_PATHS.emailChangeConfirmation",
    ]) {
      expect(shell).toContain(pathOwner);
    }

    expect(shell).toContain("AUTH_SESSION_ONLY_PATHS.has(pathname)");
    expect(shell).toContain("sessionOnlyRoute ? (");
  });

  it("does not strip profile and territory owners from authenticated contextual routes", () => {
    expect(shell).not.toMatch(/AUTH_SESSION_ONLY_PATHS[\s\S]*AUTH_PATHS\.firstAccess/);
    expect(shell).toContain("<MultiProfileProvider>");
    expect(shell).toContain("<TerritoryModeInitializer />");
    expect(shell).toContain("<ModuleContextSync />");
  });

  it("keeps SessionProvider above the route split so auth-to-app navigation does not restart session ownership", () => {
    const sessionProvider = shell.indexOf("<SessionProvider>");
    const routeSplit = shell.indexOf("{sessionOnlyRoute ? (");
    const sessionProviderClose = shell.indexOf("</SessionProvider>");

    expect(sessionProvider).toBeGreaterThanOrEqual(0);
    expect(routeSplit).toBeGreaterThan(sessionProvider);
    expect(sessionProviderClose).toBeGreaterThan(routeSplit);
  });
});
