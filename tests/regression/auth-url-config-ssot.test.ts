import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(repoRoot, path), "utf8");

const authFlow = read("src/core/auth/constants/authFlow.ts");
const authService = read("src/core/auth/services/AuthService.ts");
const supabaseConfig = read("supabase/config.toml");
const remoteConfigWorkflow = read(
  ".github/workflows/supabase-auth-url-config.yml",
);

describe("Supabase Auth URL configuration SSOT", () => {
  it("keeps the production Site URL aligned with the public app origin", () => {
    const productionEnv = read(".env.production");

    expect(productionEnv).toContain(
      "VITE_PUBLIC_SITE_URL=https://acheguese.com.br",
    );
    expect(supabaseConfig).toContain('site_url = "https://acheguese.com.br"');
    expect(remoteConfigWorkflow).toContain(
      'if ($desiredSiteUrl -ne "https://acheguese.com.br")',
    );
  });

  it("versions every Auth callback for production, Vercel and the two approved local origins", () => {
    expect(authFlow).toContain('termsAcceptance: "/aceitar-termos"');
    expect(authFlow).toContain('passwordReset: "/reset-password"');
    expect(authFlow).toContain('emailChangeConfirmation: "/conta/confirmar-email"');
    expect(authFlow).toContain("buildEmailConfirmationLoginPath");
    expect(authFlow).toContain("buildPasswordRecoveryPath");
    expect(authFlow).toContain("buildEmailChangeConfirmationPath");

    expect(authService).toContain("getEmailConfirmationRedirectUrl");
    expect(authService).toContain("getPasswordResetRedirectUrl");
    expect(authService).toContain("getEmailChangeConfirmationRedirectUrl");
    expect(authService).toContain("getTermsAcceptanceRedirectUrl");

    const origins = [
      "https://acheguese.com.br",
      "https://acheguese.vercel.app",
      "http://localhost:5175",
      "http://127.0.0.1:5175",
    ];
    const callbacks = [
      "/aceitar-termos",
      "/login?confirmed=1",
      "/conta/confirmar-email?emailChange=1",
      "/reset-password?mode=recovery",
    ];

    for (const origin of origins) {
      expect(supabaseConfig).toContain(`"${origin}"`);
      for (const callback of callbacks) {
        expect(supabaseConfig).toContain(`"${origin}${callback}"`);
      }
    }
  });

  it("makes supabase/config.toml the input authority for hosted Auth URL sync", () => {
    expect(remoteConfigWorkflow).toContain(
      "Checkout canonical Supabase config at exact SHA",
    );
    expect(remoteConfigWorkflow).toContain(
      '$configPath = "supabase/config.toml"',
    );
    expect(remoteConfigWorkflow).toContain(
      "additional_redirect_urls\\s*=\\s*(\\[[^\\r\\n]+\\])",
    );
    expect(remoteConfigWorkflow).toContain(
      "site_url = $env:DESIRED_SITE_URL",
    );
    expect(remoteConfigWorkflow).toContain(
      "uri_allow_list = $env:DESIRED_ALLOW_LIST",
    );
    expect(remoteConfigWorkflow).toContain(
      "Remote Auth URL configuration equals supabase/config.toml.",
    );
  });

  it("keeps the URL sync isolated from email transport and provider secrets", () => {
    expect(remoteConfigWorkflow).not.toContain("smtp_admin_email =");
    expect(remoteConfigWorkflow).not.toContain("smtp_pass =");
    expect(remoteConfigWorkflow).not.toContain("smtp_user =");
    expect(remoteConfigWorkflow).not.toContain("external_google_secret =");
    expect(remoteConfigWorkflow).toContain(
      "No SMTP/provider secrets were read or written by this workflow.",
    );
  });
});
