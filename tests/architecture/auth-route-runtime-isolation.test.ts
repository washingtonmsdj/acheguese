import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const shell = readFileSync(
  resolve(root, "src/app/components/SessionProfileRuntimeShell.tsx"),
  "utf8",
);
const contextualRuntime = readFileSync(
  resolve(root, "src/app/components/ContextualProfileTerritoryRuntime.tsx"),
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
    expect(shell).not.toMatch(/AUTH_SESSION_ONLY_PATHS[\s\S]*AUTH_PATHS\.firstAccess/);
  });

  it("keeps profile and territory code out of the static auth-route dependency graph", () => {
    expect(shell).toContain(
      'import("@/app/components/ContextualProfileTerritoryRuntime")',
    );
    expect(shell).not.toContain('from "@/core/profiles/');
    expect(shell).not.toContain('from "@/core/location/');

    expect(contextualRuntime).toContain("<MultiProfileProvider>");
    expect(contextualRuntime).toContain("<TerritoryModeInitializer />");
    expect(contextualRuntime).toContain("<ModuleContextSync />");
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
