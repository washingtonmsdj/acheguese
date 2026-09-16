import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Mobility driver location authority", () => {
  it("keeps driver GPS writes brokered and read-only to browser clients", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260909165500_broker_driver_location_writes_g9.sql",
    );
    const broker = readProjectFile("supabase/functions/mobility-rpc/index.ts");
    const rpcService = readProjectFile(
      "src/core/mobility/services/MobilityRpcService.ts",
    );
    const trackingService = readProjectFile(
      "src/core/tracking/services/TrackingService.ts",
    );
    const edgeBroker = readProjectFile(
      "src/core/infrastructure/edge-functions/edgeFunctionBroker.ts",
    );

    expect(migration).toContain(
      "REVOKE INSERT, UPDATE, DELETE ON TABLE public.driver_locations FROM authenticated",
    );
    expect(migration).toContain("public.mobility_update_driver_location");
    expect(migration).toContain("TO service_role");
    expect(migration).toContain("current_lat = p_lat::double precision");
    expect(migration).toContain("last_seen_at = v_now");

    expect(broker).toContain("updateDriverLocation: true");
    expect(broker).toContain("handleUpdateDriverLocation");
    expect(broker).toContain(
      "User cannot publish location for this driver profile",
    );

    expect(rpcService).toContain('"updateDriverLocation"');
    expect(rpcService).toContain("client?: SupabaseBrokerClient");
    expect(edgeBroker).toContain("client?: SupabaseBrokerClient");
    expect(edgeBroker).toContain("const brokerClient = client ?? supabase");

    const driverBranch =
      trackingService.split("if (entityType === 'driver') {")[1]?.split(
        "const tableName = this.getTableName(entityType);",
      )[0] ?? "";

    expect(driverBranch).toContain("MobilityRpcService.updateDriverLocation");
    expect(driverBranch).toContain("this.supabaseClient");
    expect(driverBranch).not.toContain("...metadata");

    expect(trackingService).not.toMatch(
      /driver_locations['"]\)[\s\S]{0,180}\.(?:insert|update|upsert|delete)\(/,
    );
  });

  it("retains exact GPS only while operationally required", () => {
    const minimization = readProjectFile(
      "supabase/migrations/20260916133000_minimize_idle_driver_gps.sql",
    );

    expect(minimization).toContain(
      "private.guard_driver_location_operational_need()",
    );
    expect(minimization).toContain("availability.is_online IS TRUE");
    expect(minimization).toContain("availability.is_available IS TRUE");
    expect(minimization).toContain("availability.active_ride_id IS NOT NULL");
    expect(minimization).toContain("NEW.current_lat := NULL");
    expect(minimization).toContain("NEW.current_lng := NULL");
    expect(minimization).toContain("NEW.last_location_update := NULL");
    expect(minimization).toContain("DELETE FROM public.driver_locations location");
    expect(minimization).toContain("driver_location_not_operationally_required");
    expect(minimization).toContain(
      "trg_purge_idle_driver_location_snapshot",
    );
  });
});
