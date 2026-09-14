import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const shell = read("src/modules/profile/components/AccountSettingsShell.tsx");
const security = read("src/modules/profile/pages/ContaSegurancaPage.tsx");
const notifications = read("src/app/pages/NotificationPreferencesPage.tsx");
const pushSettings = read("src/app/components/notifications/PushNotificationSettings.tsx");

describe("account security and notification concept polish", () => {
  it("shows dedicated nested-flow eyebrow copy on mobile without adding Minha conta noise everywhere", () => {
    expect(shell).toContain('const showDedicatedMobileEyebrow = eyebrow !== "Minha conta"');
    expect(shell).toContain("showDedicatedMobileEyebrow ? (");
    expect(shell).toContain('className="mb-2 text-sm font-medium text-territory-ink lg:hidden"');
    expect(security).toContain('eyebrow="Configurar autenticação"');
    expect(security).toContain('title="Adicione uma camada de proteção"');
  });

  it("keeps the notification device surface compact while preserving real browser state", () => {
    expect(notifications).toContain("Neste dispositivo");
    expect(notifications).toContain("<PushNotificationSettings />");
    expect(pushSettings).toContain("currentDeviceLabel");
    expect(pushSettings).toContain("Push bloqueado no navegador");
    expect(pushSettings).toContain("Push ativado neste navegador");
    expect(pushSettings).toContain("Como permitir");
    expect(pushSettings).toContain("Gerenciar dispositivos e testes");
  });

  it("keeps device management and push self-test functional instead of hiding them for visual parity", () => {
    expect(pushSettings).toContain("subscriptions.map((sub) =>");
    expect(pushSettings).toContain("unsubscribe(sub.id, sub.endpoint)");
    expect(pushSettings).toContain("const removingThis");
    expect(pushSettings).toContain('aria-label="Enviar notificação de teste para os dispositivos registrados nesta conta"');
    expect(pushSettings).toContain('"Enviar teste"');
    expect(pushSettings).toContain("Nenhum dispositivo está registrado para receber push nesta conta.");
  });
});
