import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(
  "src/app/pages/NotificationPreferencesPage.tsx",
  "utf8",
);
const hook = readFileSync(
  "src/core/notifications/hooks/useEmail.ts",
  "utf8",
);
const lifecycle = readFileSync(
  "src/app/config/productModuleRegistry.ts",
  "utf8",
);

describe("active notification lifecycle boundary", () => {
  it("keeps paused Community and Billing out of active preference copy", () => {
    expect(lifecycle).toContain('community: { status: "paused" }');
    expect(lifecycle).toContain('billing: { status: "paused" }');

    expect(page).not.toContain("Pedidos e atendimentos");
    expect(page).not.toContain("Pedidos, pagamentos e confirmações essenciais.");
    expect(page).not.toContain("Interações da comunidade");
    expect(page).not.toContain(">Comunidade<");

    expect(page).toContain("Avisos essenciais");
    expect(page).toContain("Segurança, conta e confirmações essenciais.");
    expect(page).toContain('label="Interações"');
    expect(page).toContain("Mensagens e interações da sua conta.");
  });

  it("does not expose Billing email helpers through the active notification hook", () => {
    expect(hook).not.toContain("sendPaymentConfirmationEmail:");
    expect(hook).not.toContain("sendSubscriptionExpiringEmail:");
    expect(hook).toContain("sendSecurityAlertEmail:");
  });
});
