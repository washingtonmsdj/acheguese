import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const authFlow = read("src/core/auth/constants/authFlow.ts");
const authService = read("src/core/auth/services/AuthService.ts");
const routes = read("src/app/routes/AppRoutes.tsx");
const callbackPage = read("src/app/pages/EmailChangeConfirmationPage.tsx");
const loginPage = read("src/app/pages/LoginPage.tsx");
const supabaseConfig = read("supabase/config.toml");

describe("account email change callback ownership", () => {
  it("keeps account email change separate from signup confirmation", () => {
    expect(authFlow).toContain(
      'emailChangeConfirmation: "/conta/confirmar-email"',
    );
    expect(authFlow).toContain('emailChange: "emailChange"');
    expect(authFlow).toContain("export function buildEmailChangeConfirmationPath");
    expect(authFlow).toContain("AUTH_QUERY_KEYS.emailChange");

    expect(authService).toContain(
      "static getEmailChangeConfirmationRedirectUrl(): string",
    );
    expect(authService).toContain("buildEmailChangeConfirmationPath()");
    expect(authService).toContain(
      "emailRedirectTo: AuthService.getEmailChangeConfirmationRedirectUrl()",
    );

    const updateEmailStart = authService.indexOf("static async updateEmail");
    expect(updateEmailStart).toBeGreaterThanOrEqual(0);
    expect(authService.slice(updateEmailStart)).not.toContain(
      "getEmailConfirmationRedirectUrl()",
    );
    expect(loginPage).not.toContain("AUTH_QUERY_KEYS.emailChange");
  });

  it("owns a public callback route even while launch lockdown is active", () => {
    expect(routes).toContain(
      'const EmailChangeConfirmationPage = lazy(\n  () => import("@/app/pages/EmailChangeConfirmationPage"),',
    );
    expect(
      routes.match(/path=\{AUTH_PATHS\.emailChangeConfirmation\}/g)?.length,
    ).toBe(2);
    expect(
      routes.match(/element=\{<EmailChangeConfirmationPage \/>\}/g)?.length,
    ).toBe(2);
  });

  it("waits for PKCE settlement and never enters the signup first-access journey", () => {
    expect(callbackPage).toContain("getAuthCallbackError");
    expect(callbackPage).toContain("hasPendingPkceCode");
    expect(callbackPage).toContain("window.location.search");
    expect(callbackPage).toContain(
      "AUTH_BROWSER_STORAGE_CONFIG.authUrlCleanupDelayMs",
    );
    expect(callbackPage).toContain('type EmailChangeReturnState = "checking" | "ready" | "invalid"');
    expect(callbackPage).toContain("buildLoginPath(ACCOUNT_PATHS.access)");
    expect(callbackPage).toContain("ACCOUNT_PATHS.access");
    expect(callbackPage).not.toContain("AUTH_PATHS.firstAccess");
    expect(callbackPage).not.toContain("completeEmailConfirmationLoginJourney");
  });

  it("versions the new callback in every tracked Supabase redirect origin", () => {
    expect(supabaseConfig).toContain("double_confirm_changes = true");
    for (const redirect of [
      "https://acheguese.com.br/conta/confirmar-email?emailChange=1",
      "https://acheguese.vercel.app/conta/confirmar-email?emailChange=1",
      "http://localhost:5175/conta/confirmar-email?emailChange=1",
      "http://127.0.0.1:5175/conta/confirmar-email?emailChange=1",
    ]) {
      expect(supabaseConfig).toContain(redirect);
    }
  });
});
