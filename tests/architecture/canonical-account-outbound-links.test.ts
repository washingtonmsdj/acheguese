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

  it("keeps active push actions canonical and paused destinations fail-closed", () => {
    expect(sw).toContain("case 'security':\n      return '/conta/seguranca';");
    expect(sw).toContain("case 'settings':\n      return '/conta';");
    expect(sw).toContain("const PAUSED_NOTIFICATION_ROUTE_PATTERN =");
    expect(sw).toContain("notificacoes|mensagens|community|comunidade");
    expect(sw).toContain("^\\/conta\\/notificacoes");
    expect(sw).toContain("case 'message':\n      return '/';");
    expect(sw).toContain("case 'reply':\n      return '/';");
    expect(sw).toContain("case 'order':");
    expect(sw).toContain("getLaunchSafeNotificationUrl(");
    expect(sw).toContain("`/gastronomia/pedidos/${data.orderId || ''}`");
    expect(sw).toContain("case 'payment':");
    expect(sw).toContain("getLaunchSafeNotificationUrl('/settings/subscription')");
    expect(sw).not.toContain("return '/settings/sessions';");
    expect(sw).not.toContain("return '/settings/notifications';");
    expect(sw).not.toContain("return '/conta/notificacoes';");
    expect(sw).not.toContain("return '/notificacoes';");
    expect(sw).not.toContain("return `/gastronomia/pedidos/${data.orderId || ''}`;");
    expect(sw).not.toContain("`/orders/${data.orderId || ''}`");
  });
});
