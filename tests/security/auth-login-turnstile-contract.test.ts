import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const login = read("src/app/pages/LoginPage.tsx");
const service = read("src/core/auth/services/AuthService.ts");
const types = read("src/core/auth/services/types.ts");

describe("login Turnstile contract", () => {
  it("passes the verified token from the login UI to both password-login paths", () => {
    expect(login).toContain("const captchaToken = turnstile.token ?? undefined;");
    expect(login).toContain("signInWithUsername({");
    expect(login).toContain("captchaToken,");
    expect(login).toContain("await signIn({");
    expect(login).toContain("turnstile.reset();");
  });

  it("keeps captcha optional when the gate is disabled while forwarding it when present", () => {
    expect(types).toContain("captchaToken?: string;");
    expect(service).toContain("const captchaToken = data.captchaToken?.trim();");
    expect(service).toContain("...(captchaToken ? { options: { captchaToken } } : {})");
    expect(service).toContain("...(captchaToken ? { captchaToken } : {})");
  });
});
