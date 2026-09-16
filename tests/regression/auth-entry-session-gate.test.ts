import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function read(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("authenticated auth-entry routing", () => {
  it("routes an existing login session through the legal terms authority", () => {
    const gate = read("src/app/routes/AuthEntrySessionGate.tsx");
    const routes = read("src/app/routes/AppRoutes.tsx");
    const journey = read("src/core/auth/utils/authJourney.ts");

    expect(routes).toContain('import { AuthEntrySessionGate } from "@/app/routes/AuthEntrySessionGate"');
    expect(routes).toContain("<AuthEntrySessionGate>");
    expect(routes).toContain("<LoginPage />");
    expect(routes).toContain('path={AUTH_PATHS.login} element={<LoginRoute />}');

    expect(gate).toContain("useSessionContext");
    expect(gate).toContain("prepareAuthenticatedLoginTermsCheck(redirectTo)");
    expect(gate).toContain("navigate(AUTH_PATHS.termsAcceptance, { replace: true })");
    expect(gate).not.toContain("navigate(redirectTo");

    expect(journey).toContain(
      "export function prepareAuthenticatedLoginTermsCheck(returnTo: string): void",
    );
    expect(journey).toContain("setPendingAuthJourneyIntent(AUTH_JOURNEY_INTENTS.login)");
    expect(journey).toContain("setPendingReturn(returnTo)");
    expect(journey).toContain("prepareAuthenticatedLoginTermsCheck(returnTo)");
  });

  it("does not steal confirmation, password-reset, or live callback settlement from LoginPage", () => {
    const gate = read("src/app/routes/AuthEntrySessionGate.tsx");

    expect(gate).toContain("AUTH_QUERY_KEYS.confirmed");
    expect(gate).toContain("AUTH_QUERY_KEYS.passwordReset");
    expect(gate).toContain("hasPendingAuthCallbackExchange");
    expect(gate).toContain("ownsSpecialAuthReturn");
    expect(gate).toContain("if (isLoading || !user || ownsSpecialAuthReturn) return;");
  });

  it("preserves only a safe internal return destination", () => {
    const gate = read("src/app/routes/AuthEntrySessionGate.tsx");

    expect(gate).toContain("resolveSafeInternalPath");
    expect(gate).toContain("AUTH_QUERY_KEYS.redirect");
    expect(gate).toContain('"/",');
  });
});
