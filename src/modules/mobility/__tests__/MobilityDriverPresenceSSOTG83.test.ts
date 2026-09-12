import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function projectPath(relativePath: string): string {
  return path.resolve(process.cwd(), relativePath);
}

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(projectPath(relativePath), "utf8");
}

const selfService = readProjectFile(
  "src/core/mobility/services/driverDataSelfService.ts",
);
const mutations = readProjectFile(
  "src/core/mobility/services/mobility.mutations.ts",
);
const operationalHook = readProjectFile(
  "src/core/mobility/hooks/useDriverOperationalStatus.ts",
);
const profileIdentityHook = readProjectFile(
  "src/core/mobility/hooks/useDriverProfileIdentity.ts",
);
const runtimeService = readProjectFile(
  "src/core/mobility/services/MobilityRuntimeService.ts",
);
const driverService = readProjectFile(
  "src/core/mobility/services/DriverService.impl.ts",
);
const activityStatsService = readProjectFile(
  "src/core/mobility/services/DriverActivityStatsService.ts",
);
const presenceCard = readProjectFile(
  "src/modules/mobility/components/driver/DriverPresenceStats.tsx",
);
const serviceIndex = readProjectFile(
  "src/core/mobility/services/index.ts",
);
const adminHook = readProjectFile(
  "src/core/admin/drivers/hooks/useDriverManagement.ts",
);
const adminPage = readProjectFile(
  "src/core/admin/drivers/pages/AdminMotoristasPage.tsx",
);
const adminCard = readProjectFile(
  "src/core/admin/drivers/components/cards/DriverCard.tsx",
);
const adminRuntime = readProjectFile(
  "src/core/admin/services/AdminMobilityRuntimeService.ts",
);
const adminPresence = readProjectFile(
  "src/core/admin/services/AdminDriverPresenceReadService.ts",
);
const adminQueries = readProjectFile(
  "src/core/admin/services/MobilityAdminQueryService.ts",
);
const availabilityReadPolicy = readProjectFile(
  "supabase/migrations/20260825214750_harden_driver_availability_read_privacy.sql",
);
const availabilityAuthority = readProjectFile(
  "supabase/migrations/20260909162500_harden_driver_availability_authority_g8.sql",
);

describe("G83 driver presence SSOT", () => {
  it("keeps operational presence out of driver_data self-service", () => {
    expect(selfService).toContain(
      "Operational presence,\n * availability and live location belong exclusively to driver_availability",
    );
    expect(selfService).not.toContain('"is_online",');
    expect(selfService).not.toContain('"is_available",');
    expect(selfService).not.toContain('"last_location_update",');
  });

  it("routes online/offline intent through the availability authority", () => {
    const updateOnline = mutations.slice(
      mutations.indexOf("export async function updateDriverOnlineStatus"),
      mutations.indexOf("export async function updateDriverData"),
    );
    expect(updateOnline).toContain("DriverAvailabilityService.goOnline");
    expect(updateOnline).toContain("DriverAvailabilityService.goOffline");
    expect(updateOnline).not.toContain("updateDriverData(");

    expect(runtimeService).toContain("MobilityRpcService.updateDriverAvailability");
    expect(runtimeService).toContain('availabilityAction: isOnline ? "go_online" : "go_offline"');
  });

  it("does not mirror presence back into driver_data from the driver hook", () => {
    expect(operationalHook).toContain("DriverAvailabilityService.goOnline");
    expect(operationalHook).toContain("DriverAvailabilityService.goOffline");
    expect(operationalHook).toContain("DriverAvailabilityService.setAvailable");
    expect(operationalHook).toContain("DriverAvailabilityService.pauseAvailable");
    expect(operationalHook).not.toContain("persistSnapshot");
    expect(operationalHook).not.toContain("updateDriverData");
  });

  it("hydrates driver-facing presence from driver_availability", () => {
    expect(profileIdentityHook).toContain("DriverAvailabilityService.getStatus");
    expect(profileIdentityHook).toContain("is_online: availability?.isOnline ?? false");
    expect(profileIdentityHook).toContain("is_available: availability?.isAvailable ?? false");

    expect(runtimeService).toContain('.from<DriverAvailabilityPresenceRow>("driver_availability")');
    expect(runtimeService).toContain("is_online: availability?.is_online ?? false");
    expect(runtimeService).not.toContain(
      '.select("is_verified, is_online, subscription_active")',
    );
  });

  it("keeps the legacy DriverService profile read aligned with availability", () => {
    expect(driverService).toContain("DriverAvailabilityService.getStatus");
    expect(driverService).toContain("availability?.isOnline ?? false");
    expect(driverService).not.toContain("async createDriverProfile(");
    expect(driverService).not.toContain("is_online: data.is_active");
    expect(driverService).not.toContain("is_verified: data.is_verified");
  });

  it("does not present ride duration as historical online time", () => {
    expect(
      fs.existsSync(projectPath("src/core/mobility/services/DriverPresenceService.ts")),
    ).toBe(false);
    expect(serviceIndex).toContain("DriverActivityStatsService");
    expect(serviceIndex).not.toContain("DriverPresenceService");

    expect(activityStatsService).toContain("DriverAvailabilityService.getStatus");
    expect(activityStatsService).toContain("completedRideMinutesTotal");
    expect(activityStatsService).toContain(
      'Historical\n * duration is intentionally ride duration, not "online time"',
    );
    expect(activityStatsService).not.toContain("online_today_minutes");
    expect(activityStatsService).not.toContain("total_online_time_minutes");

    expect(presenceCard).toContain("Presença operacional em tempo real");
    expect(presenceCard).toContain("Em corridas concluídas");
    expect(presenceCard).not.toContain("Sessao atual");
  });

  it("makes admin presence read-only instead of impersonating a driver session", () => {
    expect(adminHook).not.toContain("handleToggleOnline");
    expect(adminHook).not.toContain("updateDriverOnlineStatus");
    expect(adminPage).not.toContain("handleToggleDriverOnline");
    expect(adminPage).not.toContain("onToggleOnline");
    expect(adminCard).not.toContain("Colocar Online");
    expect(adminCard).not.toContain("Colocar Offline");
    expect(adminRuntime).not.toContain("updateDriverOnlineStatus");
  });

  it("sources admin cards and operational map from driver_availability", () => {
    expect(adminPresence).toContain('.from<AdminDriverPresenceRow>("driver_availability")');
    expect(adminPresence).toContain("owner-or-admin SELECT policy");
    expect(adminRuntime).toContain("AdminDriverPresenceReadService.list(profileIds)");
    expect(adminQueries).toContain("AdminDriverPresenceReadService.listOnline()");

    const activeDrivers = adminQueries.slice(
      adminQueries.indexOf("static async getActiveDriversForMap"),
      adminQueries.indexOf("static async getActiveRidesForMap"),
    );
    expect(activeDrivers).not.toContain('.eq("is_online", true)');
    expect(activeDrivers).not.toContain('"is_online, is_available, can_do_delivery');
  });

  it("relies on the existing private owner-or-admin read policy without broadening grants", () => {
    expect(availabilityReadPolicy).toContain(
      "CREATE POLICY driver_availability_owner_or_admin_read",
    );
    expect(availabilityReadPolicy).toContain(
      "USING (private.auth_can_access_profile(profile_id))",
    );
    expect(availabilityReadPolicy).toContain(
      "REVOKE SELECT ON TABLE public.driver_availability FROM anon",
    );
  });

  it("keeps presence writes service-only and actor-bound", () => {
    expect(availabilityAuthority).toContain(
      "REVOKE INSERT, UPDATE, DELETE ON TABLE public.driver_availability FROM authenticated",
    );
    expect(availabilityAuthority).toContain(
      "profile.user_id = p_actor_user_id",
    );
    expect(availabilityAuthority).toContain(
      "GRANT EXECUTE ON FUNCTION public.mobility_update_driver_availability",
    );
    expect(availabilityAuthority).toContain("TO service_role");
  });
});
