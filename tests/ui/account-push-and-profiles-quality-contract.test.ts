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
    expect(pushSettings).toContain("hasPermission");
    expect(pushSettings).toContain("isSubscribed");
    expect(pushSettings).toContain("Ao ativar, o navegador solicitará sua permissão");
    expect(pushSettings).toContain("As notificações estão bloqueadas nas permissões deste navegador");
  });

  it("lets denied browser permission override a stale server-side subscription", () => {
    expect(pushSettings).toContain("const deliveryReady = isSubscribed && !permissionBlocked");
    expect(pushSettings).toContain("const currentDeviceDescription = permissionBlocked");
    expect(pushSettings).toContain("const currentDeviceLabel = permissionBlocked");
    expect(pushSettings).toContain("{permissionBlocked ? (");
    expect(pushSettings).toContain("{deliveryReady ? (");
    expect(pushSettings).not.toContain("permissionBlocked && !isSubscribed");
  });

  it("does not expose raw push errors and refreshes permission after failed activation", () => {
    expect(pushHook).toContain("await refreshBrowserState();");
    expect(pushHook).not.toContain("description: String(error)");
    expect(pushHook).toContain("Nenhum registro foi confirmado para este dispositivo");
  });

  it("refreshes browser permission after the user returns from browser settings", () => {
    expect(pushHook).toContain("useCallback");
    expect(pushHook).toContain("window.addEventListener('focus', handleFocus)");
    expect(pushHook).toContain("document.addEventListener('visibilitychange', handleVisibilityChange)");
    expect(pushHook).toContain("document.visibilityState === 'visible'");
    expect(pushHook).toContain("window.removeEventListener('focus', handleFocus)");
    expect(pushHook).toContain("document.removeEventListener('visibilitychange', handleVisibilityChange)");
  });

  it("describes the self-test as account-wide instead of pretending it targets only this device", () => {
    expect(pushHook).toContain("Confira os dispositivos registrados para esta conta.");
    expect(pushSettings).toContain("Enviar notificação de teste para os dispositivos registrados nesta conta");
    expect(pushSettings).toContain('"Enviar teste"');
    expect(pushHook).not.toContain("Verifique se você recebeu a notificação de teste.");
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
    expect(managedProfiles).toContain('role="group"');
    expect(managedProfiles).toContain('aria-pressed={selected}');
    expect(managedProfiles).not.toContain('role="tablist"');
  });

  it("keeps personal public URLs from leaking into business or professional profiles", () => {
    expect(managedProfiles).toContain('profile.profile_type === "personal" && profile.is_public === true && Boolean(handle)');
    expect(managedProfiles).toContain("buildPublicProfileUrl(handle!)");
  });

  it("keeps repeated profile actions distinguishable to assistive technology", () => {
    expect(managedProfiles).toContain('aria-label={`Editar ${displayName}`}');
    expect(managedProfiles).toContain('aria-label={`Ver perfil público de ${displayName}`}');
    expect(managedProfiles).toContain('aria-label={`Usar ${displayName} como perfil ativo`}');
    expect(managedProfiles).not.toContain("owners canônicos");
  });

  it("keeps non-personal profile creation on canonical product flows", () => {
    expect(managedProfiles).toContain('centralRoutes.empresas.create');
    expect(managedProfiles).toContain('centralRoutes.profissional.home');
    expect(managedProfiles).toContain('centralRoutes.motorista.cadastro');
    expect(managedProfiles).toContain('centralRoutes.motoboy.cadastro');
    expect(managedProfiles).toContain("Criar ou ativar outro perfil");
    expect(managedProfiles).toContain("Criar perfil de negócio");
    expect(managedProfiles).toContain("Ativar perfil profissional");
    expect(managedProfiles).toContain("Ativar como motorista");
    expect(managedProfiles).toContain("Ativar como entregador");
  });
});