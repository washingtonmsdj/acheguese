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
const authRequiredRuntimeRoutes = readFileSync(
  resolve(root, "src/core/routing/config/authRequiredRuntimeRoutes.ts"),
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

  it("resolves anonymous protected routes before loading contextual runtime", () => {
    expect(shell).toContain("requiresPreContextAuthentication(location.pathname)");
    expect(shell).toContain("const { user, isLoading } = useSessionContext()");
    expect(shell).toContain("if (isLoading)");
    expect(shell).toContain("if (!user)");
    expect(shell).toContain("to={buildLoginPath(redirectPath)}");

    const preContextGate = shell.indexOf(
      "requiresPreContextAuthentication(location.pathname)",
    );
    const contextualRuntimeMount = shell.indexOf(
      "<ContextualProfileTerritoryRuntime>",
    );
    expect(preContextGate).toBeGreaterThanOrEqual(0);
    expect(contextualRuntimeMount).toBeGreaterThan(preContextGate);

    expect(authRequiredRuntimeRoutes).toContain("ACCOUNT_PATHS.home");
    expect(authRequiredRuntimeRoutes).toContain("messagingRoutes.inbox()");
    expect(authRequiredRuntimeRoutes).toContain('"/central"');
    expect(authRequiredRuntimeRoutes).toContain('"/notificacoes"');
    expect(authRequiredRuntimeRoutes).toContain('"/empresas/cadastrar"');
    expect(authRequiredRuntimeRoutes).toContain(
      "ProtectedRoute/CentralAccessGuard",
    );
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
