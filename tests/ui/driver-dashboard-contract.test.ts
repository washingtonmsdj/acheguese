import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relative: string): string {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}

const motoristaPage = read("src/modules/mobility/pages/MotoristaPage.tsx");
const motoboyPage = read("src/modules/mobility/pages/MotoboyPage.tsx");
const motoboyHook = read("src/modules/mobility/hooks/useMotoboyPage.ts");
const settingsPanel = read(
  "src/core/mobility/components/driver/DriverSettingsPanel.tsx",
);
const realtimeStatus = read(
  "src/modules/mobility/components/driver/DriverRealtimeStatus.tsx",
);
const weeklyEarnings = read(
  "src/core/mobility/components/driver/WeeklyEarningsChart.tsx",
);
const deliveryActions = read(
  "src/core/mobility/components/driver/MotoboyDeliveryActions.tsx",
);

const migratedDriverVisualFiles = [
  "src/modules/mobility/pages/MotoristaPage.tsx",
  "src/modules/mobility/pages/MotoboyPage.tsx",
  "src/modules/mobility/components/DriverOfferCard.tsx",
  "src/modules/mobility/components/NeighborRankingPanel.tsx",
  "src/modules/mobility/components/driver/CancelRideDialog.tsx",
  "src/modules/mobility/components/driver/CompleteRideDialog.tsx",
  "src/modules/mobility/components/driver/DriverQuickActions.tsx",
  "src/modules/mobility/components/driver/DriverRealtimeStatus.tsx",
  "src/modules/mobility/components/driver/DriverStatsPanel.tsx",
  "src/modules/mobility/components/driver/DriverSubscriptionCard.tsx",
  "src/modules/mobility/components/driver/RatePassengerDialog.tsx",
  "src/core/mobility/components/driver/DriverEarningsCard.tsx",
  "src/core/mobility/components/driver/DriverNotifications.tsx",
  "src/core/mobility/components/driver/DriverSettingsPanel.tsx",
  "src/core/mobility/components/driver/MotoboyDeliveryActions.tsx",
  "src/core/mobility/components/driver/WeeklyEarningsChart.tsx",
] as const;

const legacyPaletteClass =
  /\b(?:bg|text|border|from|to)-(?:teal|cyan|emerald|red|green|blue|violet|purple|amber|yellow|orange|pink|rose|gray|slate)-\d{2,3}(?:\/\d+)?\b/;

describe("driver dashboard contract", () => {
  it("keeps every Motorista dashboard panel inside its canonical tab", () => {
    for (const tab of ["corridas", "ganhos", "planos", "alertas", "config"]) {
      expect(motoristaPage).toContain(`<TabsContent value="${tab}"`);
    }

    expect(motoristaPage).toContain('<DriverSubscriptionCard service="motorista" />');
    expect(motoristaPage).toContain("<DriverNotifications />");
    expect(motoristaPage).toContain("<DriverSettingsPanel />");
  });

  it("starts Motoboy on a valid delivery tab and keeps every panel scoped", () => {
    for (const tab of ["entregas", "ganhos", "planos", "alertas", "config"]) {
      expect(motoboyPage).toContain(`<TabsContent value="${tab}"`);
    }

    expect(motoboyHook).toContain(
      'baseHook.activeTab === "corridas" ? "entregas" : baseHook.activeTab',
    );
    expect(motoboyPage).toContain("ACCOUNT_PATHS.home");
    expect(motoboyPage).not.toContain('navigate("/conta")');
    expect(motoboyPage).toContain('<DriverSubscriptionCard service="motoboy" />');
  });

  it("persists driver notification preferences through the canonical server-owned owner", () => {
    expect(settingsPanel).toContain("NotificationPreferencesService.get()");
    expect(settingsPanel).toContain("NotificationPreferencesService.patchChannels");
    expect(settingsPanel).toContain("ACCOUNT_PATHS.notifications");
    expect(settingsPanel).not.toContain("new Map(settings");
    expect(settingsPanel).not.toContain('id: "entregas"');
    expect(settingsPanel).not.toContain('id: "night_mode"');
    expect(settingsPanel).not.toContain('id: "safe_mode"');
    expect(settingsPanel).not.toContain('id: "sound"');
  });

  it("does not invent a realtime connection state", () => {
    expect(realtimeStatus).not.toContain("setIsConnected(true)");
    expect(realtimeStatus).not.toContain("Simular conexão realtime");
    expect(realtimeStatus).not.toContain('"Conectado"');
    expect(realtimeStatus).toContain("loading, error");
    expect(realtimeStatus).toContain(
      "Novas notificações aparecem aqui assim que forem recebidas.",
    );
  });

  it("never presents a weekly earnings read failure as zero earnings", () => {
    expect(weeklyEarnings).toContain("setError(true)");
    expect(weeklyEarnings).toContain("Ganhos semanais indisponíveis");
    expect(weeklyEarnings).toContain("Nenhum valor foi assumido como zero");
  });

  it("keeps delivery verification and failure forms server-command driven", () => {
    expect(deliveryActions).toContain(
      "OperationalVerificationService.getVerificationStatusSummaryResult",
    );
    expect(deliveryActions).toContain("OperationalVerificationService.isValidPINFormat");
    expect(deliveryActions).toContain("await onConfirmDelivery(");
    expect(deliveryActions).toContain("await onFailDelivery(");
  });

  it("keeps migrated driver surfaces on semantic/category tokens", () => {
    for (const relative of migratedDriverVisualFiles) {
      const source = read(relative);
      expect(source, relative).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(/);
      expect(source, relative).not.toMatch(legacyPaletteClass);
    }
  });
});
