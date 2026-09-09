import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("mobility rpc broker security", () => {
  it("routes mobility dispatch helpers through an authenticated broker", () => {
    const edgeFunction = readProjectFile("supabase/functions/mobility-rpc/index.ts");
    const config = readProjectFile("supabase/config.toml");
    const broker = readProjectFile("src/core/mobility/services/MobilityRpcService.ts");
    const offerService = readProjectFile("src/core/mobility/services/MobilityOfferService.ts");
    const auditService = readProjectFile("src/core/mobility/services/MobilityAuditService.ts");
    const availabilityService = readProjectFile(
      "src/core/mobility/services/DriverAvailabilityService.ts",
    );

    expect(config).toContain("[functions.mobility-rpc]");
    expect(config).toMatch(/\[functions\.mobility-rpc\]\s+verify_jwt = true/);

    expect(edgeFunction).toContain("function requireUser(");
    expect(edgeFunction).toContain('getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("accept_ride_atomic"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("cancel_pending_ride_offers"');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("release_driver_availability_for_ride"');
    expect(edgeFunction).toContain('.from("ride_requests")');
    expect(edgeFunction).toContain('.from("profiles")');
    expect(edgeFunction).toContain('supabaseAdmin.rpc("is_admin"');
    expect(edgeFunction).toContain("p_user_id: userId");
    expect(edgeFunction).not.toContain('.from("user_roles")');
    expect(edgeFunction).toContain("requireDispatchStrategy");
    expect(edgeFunction).toContain("handleAcceptRide");
    expect(edgeFunction).not.toContain("canWriteDispatchAudit");
    expect(edgeFunction).not.toContain("requireDispatchWriteAccess");
    expect(edgeFunction).not.toContain("logDispatchAttempt");
    expect(edgeFunction).not.toContain("updateLatestDispatchAttempt");
    expect(edgeFunction).not.toContain("log_ride_dispatch_attempt");
    expect(edgeFunction).not.toContain("update_latest_ride_dispatch_attempt");
    expect(edgeFunction).toContain("canAccessRideAsParticipantOrAdmin");
    expect(edgeFunction).not.toMatch(/p_user_id:\s*params\./);
    expect(edgeFunction).not.toMatch(/p_user_id:\s*rawBody/);

    expect(broker).toContain('const FUNCTION_NAME = "mobility-rpc"');
    expect(broker).toContain('"acceptRide"');

    for (const source of [offerService, auditService, availabilityService]) {
      expect(source).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']accept_ride_atomic/);
      expect(source).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']log_ride_dispatch_attempt/);
      expect(source).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']update_latest_ride_dispatch_attempt/);
      expect(source).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']cancel_pending_ride_offers/);
      expect(source).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']release_driver_availability_for_ride/);
    }
  });

  it("revokes direct browser execution of backing mobility RPCs", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260707220108_route_mobility_dispatch_rpcs_through_edge_function.sql",
    );
    const acceptMigration = readProjectFile(
      "supabase/migrations/20260707224108_route_mobility_accept_ride_through_edge_function.sql",
    );

    for (const signature of [
      "public.log_ride_dispatch_attempt(uuid, uuid, integer, timestamptz, timestamptz, text)",
      "public.update_latest_ride_dispatch_attempt(uuid, uuid, text, timestamptz)",
      "public.cancel_pending_ride_offers(uuid)",
      "public.release_driver_availability_for_ride(uuid, uuid)",
    ]) {
      expect(migration).toContain(`REVOKE ALL ON FUNCTION ${signature}`);
      expect(migration).toContain("FROM PUBLIC, anon, authenticated");
      expect(migration).toContain(`GRANT EXECUTE ON FUNCTION ${signature}`);
      expect(migration).toContain("TO service_role");
    }

    expect(migration).toContain("v_is_service_role");

    expect(acceptMigration).toContain(
      "REVOKE ALL ON FUNCTION public.accept_ride_atomic(uuid, uuid, text)",
    );
    expect(acceptMigration).toContain("FROM PUBLIC, anon, authenticated");
    expect(acceptMigration).toContain(
      "GRANT EXECUTE ON FUNCTION public.accept_ride_atomic(uuid, uuid, text)",
    );
    expect(acceptMigration).toContain("TO service_role");
    expect(acceptMigration).toContain("IF NOT EXISTS (");
    expect(acceptMigration).toContain("dd.is_verified = true");
    expect(acceptMigration).toContain("dd.is_online = true");
    expect(acceptMigration).toContain("dd.is_available = true");
  });

  it("retires dispatch audit RPCs superseded by atomic server-owned commands", () => {
    const retirement = readProjectFile(
      "supabase/migrations/20260909180639_retire_legacy_mobility_dispatch_audit_rpcs_g15.sql",
    );
    const edgeFunction = readProjectFile("supabase/functions/mobility-rpc/index.ts");
    const rpcService = readProjectFile("src/core/mobility/services/MobilityRpcService.ts");
    const auditService = readProjectFile("src/core/mobility/services/MobilityAuditService.ts");
    const autoDispatch = readProjectFile("supabase/functions/auto-dispatch-ride/index.ts");
    const atomicDispatch = readProjectFile(
      "supabase/migrations/20260909125837_harden_atomic_mobility_dispatch_authority_g6.sql",
    );

    for (const name of [
      "log_ride_dispatch_attempt",
      "update_latest_ride_dispatch_attempt",
      "can_write_ride_dispatch_audit",
    ]) {
      expect(retirement).toContain(`DROP FUNCTION IF EXISTS public.${name}`);
    }

    for (const source of [edgeFunction, rpcService, auditService]) {
      expect(source).not.toContain("logDispatchAttempt");
      expect(source).not.toContain("updateLatestDispatchAttempt");
      expect(source).not.toContain("log_ride_dispatch_attempt");
      expect(source).not.toContain("update_latest_ride_dispatch_attempt");
    }

    expect(autoDispatch).toContain("mobility_offer_driver_atomic");
    expect(autoDispatch).toContain("mobility_timeout_driver_offer_atomic");
    expect(atomicDispatch).toContain("INSERT INTO public.ride_dispatch_audit");
  });
});
