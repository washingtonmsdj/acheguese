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
const activeRideWidget = read(
  "src/modules/mobility/components/ActiveRideWidget.tsx",
);
const driverLocationHook = read(
  "src/core/mobility/hooks/useDriverLocation.ts",
);
const rideTrackingMap = read(
  "src/core/mobility/components/RideTrackingMap.tsx",
);
const geolocationButton = read(
  "src/modules/mobility/components/GeolocationButton.tsx",
);
const mobilityChatList = read(
  "src/modules/mobility/components/chat/MobilityChatList.tsx",
);

const migratedDriverVisualFiles = [
  "src/modules/mobility/pages/MotoristaPage.tsx",
  "src/modules/mobility/pages/MotoboyPage.tsx",
  "src/modules/mobility/components/ActiveRideWidget.tsx",
  "src/modules/mobility/components/BoardingPointsPanel.tsx",
  "src/modules/mobility/components/DriverOfferCard.tsx",
  "src/modules/mobility/components/GeolocationButton.tsx",
  "src/modules/mobility/components/NeighborRankingPanel.tsx",
  "src/modules/mobility/components/chat/MobilityChatList.tsx",
  "src/modules/mobility/components/driver/CancelRideDialog.tsx",
  "src/modules/mobility/components/driver/CompleteRideDialog.tsx",
  "src/modules/mobility/components/driver/DriverQuickActions.tsx",
  "src/modules/mobility/components/driver/DriverRealtimeStatus.tsx",
  "src/modules/mobility/components/driver/DriverStatsPanel.tsx",
  "src/modules/mobility/components/driver/DriverSubscriptionCard.tsx",
  "src/modules/mobility/components/driver/RatePassengerDialog.tsx",
  "src/modules/mobility/components/passenger/ride-card/DriverInfo.tsx",
  "src/core/mobility/components/RideTrackingMap.tsx",
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

  it("does not invent realtime connection state in notification or ride tracking UI", () => {
    expect(realtimeStatus).not.toContain("setIsConnected(true)");
    expect(realtimeStatus).not.toContain("Simular conexão realtime");
    expect(realtimeStatus).not.toContain('"Conectado"');
    expect(realtimeStatus).toContain("loading, error");

    expect(driverLocationHook).not.toContain("setIsConnected(true)");
    expect(driverLocationHook).toContain("hasLiveUpdate");
    expect(driverLocationHook).toContain("setHasLiveUpdate(true)");
    expect(rideTrackingMap).not.toContain("'Conectado'");
    expect(rideTrackingMap).toContain("displayHasLiveUpdate");
    expect(rideTrackingMap).toContain("mapInitializationError");
  });

  it("derives active ride and mobility chat status from the canonical lifecycle", () => {
    expect(activeRideWidget).toContain("RIDE_STATUS_LABELS");
    expect(activeRideWidget).toContain("RIDE_STATUS.DRIVER_ACCEPTED");
    expect(activeRideWidget).toContain("RIDE_STATUS.IN_DELIVERY");
    expect(activeRideWidget).not.toContain('accepted: {');

    expect(mobilityChatList).toContain("RIDE_STATUS_LABELS");
    expect(mobilityChatList).toContain("RIDE_STATUS.PICKUP_CONFIRMED");
    expect(mobilityChatList).toContain("RIDE_STATUS.IN_DELIVERY");
    expect(mobilityChatList).toContain("CLOSED_RIDE_STATUSES");
    expect(mobilityChatList).toContain("loadError");
    expect(mobilityChatList).toContain("appUrls.messages");
  });

  it("keeps geolocation UI free of hardcoded dispatch promises", () => {
    expect(geolocationButton).toContain("regras operacionais vigentes");
    expect(geolocationButton).not.toContain("5km");
    expect(geolocationButton).not.toContain("Match Inteligente");
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

  it("keeps migrated mobility surfaces on semantic/category tokens", () => {
    for (const relative of migratedDriverVisualFiles) {
      const source = read(relative);
      expect(source, relative).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(/);
      expect(source, relative).not.toMatch(legacyPaletteClass);
    }
  });
});
