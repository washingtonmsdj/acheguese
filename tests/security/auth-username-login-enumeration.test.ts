import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "supabase/functions/auth-username-login/index.ts"),
  "utf8",
);

describe("username login enumeration resistance", () => {
  it("keeps missing and existing usernames on the password-auth path", () => {
    const lookupIndex = source.indexOf(
      'await supabaseAdmin.rpc("get_email_by_username"',
    );
    const passwordAuthIndex = source.indexOf(
      "await authClient.auth.signInWithPassword",
    );

    expect(lookupIndex).toBeGreaterThanOrEqual(0);
    expect(passwordAuthIndex).toBeGreaterThan(lookupIndex);
    expect(source.slice(lookupIndex, passwordAuthIndex)).not.toContain(
      "return returnInvalidLogin(req)",
    );
    expect(source).toContain("INVALID_USERNAME_AUTH_EMAIL");
    expect(source).toContain("resolvedEmail ?? INVALID_USERNAME_AUTH_EMAIL");
  });

  it("forwards a bounded optional captcha token to Supabase Auth", () => {
    expect(source).toContain("MAX_CAPTCHA_TOKEN_LENGTH = 2048");
    expect(source).toContain("readCaptchaToken(validation.data!)");
    expect(source).toContain("...(captchaToken ? { options: { captchaToken } } : {})");
    expect(source).toContain("maxBytes: 4096");
  });

  it("keeps the external failure response generic", () => {
    expect(source).toContain(
      'const INVALID_LOGIN_MESSAGE = "Invalid login credentials";',
    );
    expect(source).toContain(
      "jsonResponse({ error: INVALID_LOGIN_MESSAGE }, 401",
    );
    expect(source).not.toContain('error: "identifier_not_found"');
  });
});
