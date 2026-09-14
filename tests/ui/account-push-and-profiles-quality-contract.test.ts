import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const pushHook = read("src/core/notifications/hooks/usePush.ts");
const pushSettings = read("src/app/components/notifications/PushNotificationSettings.tsx");
const managedProfiles = read("src/modules/profile/components/ManagedProfilesPanel.tsx");

describe("account push and managed-profile quality contract", () => {
  it("keeps browser permission separate from server registration", () => {
    expect(pushHook).toContain("permission");
    expect(pushHook).toContain("Notification.permission");
    expect(pushSettings).toContain('permission === "denied"');
    expect(pushSettings).toContain('hasPermission');
    expect(pushSettings).toContain('isSubscribed');
    expect(pushSettings).toContain("Ao ativar, o navegador solicitará sua permissão");
    expect(pushSettings).toContain("As notificações estão bloqueadas nas permissões deste navegador");
  });

  it("does not expose raw push errors and refreshes permission after failed activation", () => {
    expect(pushHook).toContain("await refreshBrowserState();");
    expect(pushHook).not.toContain("description: String(error)");
    expect(pushHook).toContain("Nenhum registro foi confirmado para este dispositivo");
  });

  it("shows precise empty and per-device mutation states", () => {
    expect(pushHook).toContain("unsubscribingSubscriptionId");
    expect(pushSettings).toContain("Nenhum dispositivo está registrado para receber push nesta conta.");
    expect(pushSettings).toContain("const removingThis");
    expect(pushSettings).toContain("removingThis ? (");
  });

  it("preserves every runtime profile category in account filters", () => {
    for (const profileType of [
      '"personal"',
      '"business"',
      '"professional"',
      '"driver"',
      '"communication_channel"',
    ]) {
      expect(managedProfiles).toContain(profileType);
    }
    expect(managedProfiles).toContain('label: "Mobilidade"');
    expect(managedProfiles).toContain('label: "Comunicação"');
  });

  it("keeps repeated profile actions distinguishable to assistive technology", () => {
    expect(managedProfiles).toContain('aria-label={`Editar ${displayName}`}');
    expect(managedProfiles).toContain('aria-label={`Ver perfil público de ${displayName}`}');
    expect(managedProfiles).toContain('aria-label={`Usar ${displayName} como perfil ativo`}');
    expect(managedProfiles).not.toContain("owners canônicos");
  });
});
