import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

describe("canonical outbound account links", () => {
  const account = read("src/core/routing/config/account.ts");
  const email = read("src/core/notifications/services/EmailService.ts");
  const sw = read("public/sw.js");
  const checkoutSuccess = read("src/app/pages/CheckoutSuccessPage.tsx");
  const checkoutCancel = read("src/app/pages/CheckoutCancelPage.tsx");

  it("keeps email CTAs on the canonical account routing SSOT", () => {
    expect(account).toContain('home: "/conta"');
    expect(account).toContain('security: "/conta/seguranca"');
    expect(account).toContain('mfa: "/conta/seguranca#mfa"');

    expect(email).toContain("buildPublicAbsoluteUrl(ACCOUNT_PATHS.home)");
    expect(email).toContain("buildPublicAbsoluteUrl(ACCOUNT_PATHS.mfa)");
    expect(email).toContain("buildPublicAbsoluteUrl(ACCOUNT_PATHS.security)");
    expect(email).not.toContain("buildPublicAbsoluteUrl('/dashboard')");
    expect(email).not.toContain("buildPublicAbsoluteUrl('/settings/security')");
    expect(email).not.toContain("buildPublicAbsoluteUrl('/settings/sessions')");
  });

  it("keeps security and settings push actions on canonical account routes", () => {
    expect(sw).toContain("case 'security':\n      return '/conta/seguranca';");
    expect(sw).toContain("case 'settings':\n      return '/conta/notificacoes';");
    expect(sw).not.toContain("return '/settings/sessions';");
    expect(sw).not.toContain("return '/settings/notifications';");
  });

  it("does not restore the removed generic dashboard destination in checkout", () => {
    expect(checkoutSuccess).toContain("navigate(ACCOUNT_PATHS.home)");
    expect(checkoutCancel).toContain("navigate(ACCOUNT_PATHS.home)");
    expect(checkoutSuccess).not.toContain("navigate('/dashboard')");
    expect(checkoutCancel).not.toContain("navigate('/dashboard')");
  });
});
