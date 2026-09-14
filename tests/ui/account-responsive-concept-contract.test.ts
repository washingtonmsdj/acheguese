import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const shell = read("src/modules/profile/components/AccountSettingsShell.tsx");
const notifications = read("src/app/pages/NotificationPreferencesPage.tsx");

describe("responsive account concept contract", () => {
  it("allows mobile and desktop concepts to share one authoritative shell", () => {
    expect(shell).toContain("mobileTitle");
    expect(shell).toContain("desktopTitle");
    expect(shell).toContain("mobileDescription");
    expect(shell).toContain("desktopDescription");
    expect(shell).toContain('className="lg:hidden"');
    expect(shell).toContain('className="hidden lg:inline"');
    expect(shell).toContain("resolvedMobileTitle");
    expect(shell).toContain("resolvedDesktopTitle");
    expect(shell).toContain("hideMobileHeading = false");
    expect(shell).toContain('hideMobileHeading && "hidden lg:block"');
  });

  it("keeps notification behavior real while matching the mobile and desktop concepts", () => {
    expect(notifications).toContain('title="Notificações"');
    expect(notifications).toContain('desktopTitle="Controle o que chega até você"');
    expect(notifications).toContain('mobileDescription="Escolha como receber novidades e avisos."');
    expect(notifications).toContain("Canais");
    expect(notifications).toContain("Neste dispositivo");
    expect(notifications).toContain("Tipos de aviso");
    expect(notifications).toContain("Interações da comunidade");
    expect(notifications).toContain("Atualizações do sistema");
    expect(notifications).toContain("Horário de silêncio");
    expect(notifications).toContain("Frequência dos avisos");
    expect(notifications).toContain("<PushNotificationSettings />");
    expect(notifications).toContain("preferences.push_enabled");
    expect(notifications).toContain("NotificationPreferencesService.patchAll(prefs)");
    expect(notifications).toContain("QUIET_DAY_OPTIONS");
    expect(notifications).toContain('aria-pressed={selected}');
  });

  it("keeps desktop channels and device state in one concept card while mobile stays segmented", () => {
    expect(notifications).toContain("lg:block lg:rounded-2xl lg:border lg:border-territory-border lg:bg-territory-surface");
    expect(notifications).toContain("lg:mt-2 lg:rounded-none lg:border-0 lg:border-t");
    expect(notifications).toContain("Preferência de push da conta");
    expect(notifications).toContain('id="push"');
    expect(notifications).toContain("<PushNotificationSettings />");
  });

  it("keeps quiet hours compact on mobile without dropping the full editor", () => {
    expect(notifications).toContain("const quietHoursSummary");
    expect(notifications).toContain('"Intervalo incompleto"');
    expect(notifications).toContain('"Definir horário"');
    expect(notifications).toContain("renderQuietHoursControls");
    expect(notifications).toContain('renderQuietHoursControls("mobile")');
    expect(notifications).toContain('renderQuietHoursControls("desktop")');
    expect(notifications).toContain("open={quietHoursInvalid || undefined}");
    expect(notifications).toContain("Horário local do dispositivo.");
    expect(notifications).toContain('className="mt-4 lg:hidden"');
    expect(notifications).toContain('className="mt-4 hidden p-4 sm:p-5 lg:block"');
  });

  it("puts the approved mobile save action immediately after quiet hours while keeping frequency available", () => {
    expect(notifications).toContain("const renderSaveButton");
    expect(notifications).toContain("saveButtonLabel");
    const mobileQuietHours = notifications.indexOf("Horário local do dispositivo.");
    const firstSaveAction = notifications.indexOf("renderSaveButton(", mobileQuietHours);
    const frequency = notifications.indexOf("Frequência dos avisos", mobileQuietHours);
    expect(mobileQuietHours).toBeGreaterThan(-1);
    expect(firstSaveAction).toBeGreaterThan(mobileQuietHours);
    expect(frequency).toBeGreaterThan(firstSaveAction);
    expect(notifications).toContain('className="hidden lg:block"');
  });

  it("gives the mobile and desktop quiet-hours editors unique form ids", () => {
    expect(notifications).toContain('const startId = `${idPrefix}-quiet-start`');
    expect(notifications).toContain('const endId = `${idPrefix}-quiet-end`');
    expect(notifications).toContain('const errorId = `${idPrefix}-quiet-hours-error`');
    expect(notifications).not.toContain('id="quiet-start"');
    expect(notifications).not.toContain('id="quiet-end"');
  });
});