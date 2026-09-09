import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Mobility delivery command authority", () => {
  it("keeps delivery state and sensitive metadata server-owned and atomic", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260909124319_add_atomic_mobility_delivery_commands_g6.sql",
    );
    const resolutionHardening = readProjectFile(
      "supabase/migrations/20260909181245_harden_failed_delivery_resolution_authority_g16.sql",
    );
    const deliveryActions = readProjectFile(
      "src/core/mobility/core/RideDeliveryOperationalActions.ts",
    );
    const operationalService = readProjectFile(
      "src/core/mobility/core/RideOperationalService.ts",
    );
    const rpcService = readProjectFile(
      "src/core/mobility/services/MobilityRpcService.ts",
    );
    const broker = readProjectFile("supabase/functions/mobility-rpc/index.ts");
    const failedDeliveryType = readProjectFile(
      "src/core/mobility/types/FailedDeliveryMetadata.ts",
    );
    const operationalGuards = readProjectFile(
      "src/core/mobility/core/RideOperationalGuards.ts",
    );

    expect(migration).toContain("mobility_transition_delivery_state_atomic");
    expect(migration).toContain(
      "mobility_update_failed_delivery_resolution_atomic",
    );
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("INSERT INTO public.ride_state_audit");
    expect(migration).toContain("TO service_role");
    expect(migration).toContain("FROM PUBLIC, anon, authenticated");

    expect(resolutionHardening).toContain(
      "resolved delivery resolution cannot be reopened",
    );
    expect(resolutionHardening).toContain(
      "next ride is not a compatible redelivery",
    );
    expect(resolutionHardening).toContain(
      "driver.can_do_delivery IS TRUE",
    );
    expect(resolutionHardening).toContain(
      "driver.is_verified IS TRUE",
    );
    expect(resolutionHardening).toContain(
      "driver.subscription_active IS TRUE",
    );
    expect(resolutionHardening).toContain(
      "resolution owner must belong to an active admin profile",
    );
    expect(resolutionHardening).toContain(
      "public.is_admin(profile.user_id)",
    );
    expect(resolutionHardening).toContain(
      "handoff_driver_profile_id is required to resolve a handoff",
    );

    expect(deliveryActions).not.toContain("updateRideMutation(");
    expect(deliveryActions).toContain('type: "confirm_pickup"');
    expect(deliveryActions).toContain('type: "confirm_delivery"');
    expect(deliveryActions).toContain('type: "fail_delivery"');
    expect(deliveryActions).toContain(
      "MobilityRpcService.updateFailedDeliveryResolution",
    );

    expect(rpcService).toContain('"transitionDeliveryState"');
    expect(rpcService).toContain('"updateFailedDeliveryResolution"');

    expect(broker).toContain("handleTransitionDeliveryState");
    expect(broker).toContain("handleUpdateFailedDeliveryResolution");
    expect(broker).toContain(
      "Admin authority is required to resolve failed deliveries",
    );
    expect(broker).toMatch(
      /handleUpdateFailedDeliveryResolution[\s\S]*?if \(!auth\.isProjectAdmin\)/,
    );
    expect(broker).not.toMatch(
      /handleUpdateFailedDeliveryResolution[\s\S]*?canAccessRideAsParticipantOrAdmin/,
    );
    expect(broker).toContain("requireDeliveryTransitionActor");
    expect(broker).toContain("requireDeliveryVerification");
    expect(broker).toContain(
      '"mobility_transition_delivery_state_atomic"',
    );
    expect(broker).toContain(
      '"mobility_update_failed_delivery_resolution_atomic"',
    );
    expect(broker).toContain('toState === "pickup_confirmed"');
    expect(broker).toContain('toState === "delivered"');
    expect(broker).toContain('toState === "failed_delivery"');

    expect(operationalService).toContain("expectedDeliveryState");
    expect(operationalService).toContain(
      "MobilityRpcService.transitionDeliveryState",
    );
    expect(operationalService).toContain(
      "Ride transition returned unexpected state",
    );

    expect(failedDeliveryType).toContain("attempted_delivery_count?: number");
    expect(failedDeliveryType).toContain(
      "export interface FailedDeliveryResolutionUpdate",
    );

    const resolutionInputStart = failedDeliveryType.indexOf(
      "export interface FailedDeliveryResolutionUpdate",
    );
    const resolutionInputEnd = failedDeliveryType.indexOf(
      "\n}",
      resolutionInputStart,
    );
    const resolutionInput = failedDeliveryType.slice(
      resolutionInputStart,
      resolutionInputEnd,
    );
    expect(resolutionInput).not.toContain("resolved_at");
    expect(operationalGuards).not.toContain(
      "resolved_at obrigatorio quando resolution_status = resolved",
    );
  });
});
