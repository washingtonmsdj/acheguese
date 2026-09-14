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

  it("gives the mobile and desktop quiet-hours editors unique form ids", () => {
    expect(notifications).toContain('const startId = `${idPrefix}-quiet-start`');
    expect(notifications).toContain('const endId = `${idPrefix}-quiet-end`');
    expect(notifications).toContain('const errorId = `${idPrefix}-quiet-hours-error`');
    expect(notifications).not.toContain('id="quiet-start"');
    expect(notifications).not.toContain('id="quiet-end"');
  });
});