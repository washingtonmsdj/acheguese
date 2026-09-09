import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_ROOT = path.resolve(process.cwd(), "src");
const DIRECT_RIDE_INSERT =
  /\.from(?:<[^>]+>)?\(\s*["']ride_requests["']\s*\)[\s\S]{0,400}?\.insert\s*\(/;
const DIRECT_RIDE_UPDATE =
  /\.from(?:<[^>]+>)?\(\s*["']ride_requests["']\s*\)[\s\S]{0,400}?\.update\s*\(/;

function collectRuntimeFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "__tests__" ||
        entry.name === "__mocks__" ||
        entry.name === "fixtures"
      ) {
        return [];
      }
      return collectRuntimeFiles(absolute);
    }

    if (!/\.(ts|tsx)$/.test(entry.name) || entry.name.endsWith(".test.ts")) {
      return [];
    }
    return [absolute];
  });
}

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("ride_requests browser write authority", () => {
  it("keeps runtime source free from direct ride INSERT chains", () => {
    const violations = collectRuntimeFiles(SOURCE_ROOT)
      .filter((file) => DIRECT_RIDE_INSERT.test(fs.readFileSync(file, "utf8")))
      .map((file) => path.relative(process.cwd(), file));

    expect(violations).toEqual([]);
  });

  it("keeps runtime source free from direct ride UPDATE chains", () => {
    const violations = collectRuntimeFiles(SOURCE_ROOT)
      .filter((file) => DIRECT_RIDE_UPDATE.test(fs.readFileSync(file, "utf8")))
      .map((file) => path.relative(process.cwd(), file));

    expect(violations).toEqual([]);
  });

  it("does not expose the retired generic ride update helpers", () => {
    const mutations = read("src/core/mobility/services/mobility.mutations.ts");
    const facade = read("src/core/mobility/services/MobilityService.ts");
    const staticService = read("src/core/mobility/services/MobilityService.impl.ts");
    const runtime = read("src/core/mobility/services/MobilityRuntimeService.ts");

    for (const source of [mutations, facade, staticService, runtime]) {
      expect(source).not.toContain("updateRideWithGuards");
      expect(source).not.toContain("updateRideIfStatusIn");
    }

    expect(mutations).not.toMatch(/export\s+async\s+function\s+updateRide\s*\(/);
    expect(staticService).not.toMatch(/static\s+async\s+updateRide\s*\(/);
  });

  it("keeps database INSERT authority server-owned", () => {
    const creationMigration = read(
      "supabase/migrations/20260909140626_add_atomic_mobility_creation_commands_g6.sql",
    );
    const revokeMigration = read(
      "supabase/migrations/20260909141356_revoke_browser_ride_request_insert_g6.sql",
    );
    const broker = read("supabase/functions/mobility-rpc/index.ts");
    const rpcService = read(
      "src/core/mobility/services/MobilityRpcService.ts",
    );

    expect(creationMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.mobility_create_ride_atomic",
    );
    expect(creationMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.mobility_create_delivery_atomic",
    );
    expect(creationMigration).toContain("INSERT INTO public.ride_state_audit");
    expect(creationMigration).toContain("TO service_role");

    expect(revokeMigration).toContain(
      "REVOKE INSERT ON TABLE public.ride_requests FROM PUBLIC, anon, authenticated",
    );
    expect(revokeMigration).toContain(
      'DROP POLICY IF EXISTS "Passengers create rides" ON public.ride_requests',
    );

    expect(broker).toContain("createRide: true");
    expect(broker).toContain("createDelivery: true");
    expect(broker).toContain("requireEffectiveMobilityRollout");
    expect(broker).toContain("broker_user_can_manage_profile");
    expect(broker).toContain("requireBusinessDeliveryEntitlement");
    expect(broker).toContain('"mobility_create_ride_atomic"');
    expect(broker).toContain('"mobility_create_delivery_atomic"');

    expect(rpcService).toContain('this.invoke("createRide"');
    expect(rpcService).toContain('this.invoke("createDelivery"');
  });

  it("keeps database UPDATE authority server-owned", () => {
    const migration = read(
      "supabase/migrations/20260909135451_revoke_browser_ride_request_update_g6.sql",
    );
    const passengerMigration = read(
      "supabase/migrations/20260909134558_add_atomic_passenger_ride_completion_confirmation_g6.sql",
    );
    const broker = read("supabase/functions/mobility-rpc/index.ts");

    expect(migration).toContain(
      "REVOKE UPDATE ON TABLE public.ride_requests FROM PUBLIC, anon, authenticated",
    );
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Participants update rides" ON public.ride_requests',
    );

    expect(passengerMigration).toContain(
      "CREATE OR REPLACE FUNCTION public.mobility_confirm_passenger_completion_atomic",
    );
    expect(passengerMigration).toContain("FOR UPDATE");
    expect(passengerMigration).toContain("TO service_role");

    expect(broker).toContain("confirmPassengerCompletion");
    expect(broker).toContain("Only the ride passenger can confirm completion");
    expect(broker).toContain(
      '"mobility_confirm_passenger_completion_atomic"',
    );
  });
});
