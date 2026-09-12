import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

const migration = readProjectFile(
  "supabase/migrations/20260911234000_reopen_failed_delivery_same_custodian_g82.sql",
);
const metadataTypes = readProjectFile(
  "src/core/mobility/types/FailedDeliveryMetadata.ts",
);
const guards = readProjectFile(
  "src/core/mobility/core/RideOperationalGuards.ts",
);
const actions = readProjectFile(
  "src/core/mobility/core/RideDeliveryOperationalActions.ts",
);

describe("G82 canonical same-custodian failed-delivery retry", () => {
  it("retires caller-owned successor rides from the administrative command", () => {
    const commandContract = metadataTypes.slice(
      metadataTypes.indexOf("export interface FailedDeliveryResolutionUpdate"),
      metadataTypes.indexOf("export interface CustodyHandoffHistoryEntry"),
    );

    expect(commandContract).toContain("retry_delivery_requested?: true");
    expect(commandContract).not.toContain("next_ride_id?: string");
    expect(migration).toContain("IF p_resolution_update ? 'next_ride_id' THEN");
    expect(migration).toContain(
      "next_ride_id is legacy server-owned metadata and cannot be supplied",
    );
  });

  it("reopens the same failed ride instead of creating a second logistics identity", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION private.mobility_retry_failed_delivery_same_custodian_g82",
    );
    expect(migration).toContain("WHERE request.id = p_ride_id");
    expect(migration).toContain("SET status = 'in_delivery'");
    expect(migration).toContain("'ride_id', p_ride_id");
    expect(migration).toContain("'retry_reopened', true");
    expect(migration).not.toContain("INSERT INTO public.ride_requests");
  });

  it("requires custody to remain with the assigned driver and blocks active handoff", () => {
    expect(migration).toContain(
      "item_current_holder' IS DISTINCT FROM 'driver'",
    );
    expect(migration).toContain(
      "same-driver retry requires awaiting_manual_resolution destination",
    );
    expect(migration).toContain(
      "active handoff must be completed or expire before same-driver retry",
    );
  });

  it("requires the current custodian to own the active ride with fresh presence and location", () => {
    expect(migration).toContain(
      "v_availability.active_ride_id IS DISTINCT FROM p_ride_id",
    );
    expect(migration).toContain(
      "v_availability.last_seen_at < v_now - interval '5 minutes'",
    );
    expect(migration).toContain("v_availability.current_lat IS NULL");
    expect(migration).toContain("v_availability.current_lng IS NULL");
    expect(migration).toContain(
      "v_availability.last_location_update < v_now - interval '5 minutes'",
    );
  });

  it("revalidates delivery eligibility and linked gastronomy custody server-side", () => {
    expect(migration).toContain("driver.is_verified = true");
    expect(migration).toContain("driver.subscription_active = true");
    expect(migration).toContain("driver.can_do_delivery = true");
    expect(migration).toContain(
      "v_order.logistics_status::text IS DISTINCT FROM 'picked_up'",
    );
    expect(migration).toContain(
      "v_order.courier_profile_id IS DISTINCT FROM v_driver_profile_id",
    );
  });

  it("cleans legacy successor and expired handoff linkage before persisting retry metadata", () => {
    expect(migration).toContain("v_clean_metadata := v_ride.failed_delivery_metadata - ARRAY[");
    expect(migration).toContain("'next_ride_id'");
    expect(migration).toContain("'handoff_requested_driver_profile_id'");
    expect(migration).toContain("'handoff_request_expires_at'");
    expect(migration).toContain("'resolution_plan', 'retry_same_driver'");
    expect(migration).toContain("'resolution_action', 'retry_same_driver'");
    expect(migration).toContain("'retry_driver_profile_id', v_driver_profile_id::text");
  });

  it("keeps browser validation aligned with the exclusive retry command", () => {
    expect(guards).toContain(
      "resolution_action_notes obrigatorio para retomar a entrega.",
    );
    expect(guards).toContain(
      "retry_delivery_requested nao pode ser combinado com handoff, escalonamento ou resolution_status manual.",
    );
    expect(guards).toContain(
      "handoff nao pode ser combinado com nova tentativa ou escalonamento manual.",
    );
  });

  it("surfaces the canonical retry transition without successor-ride fields", () => {
    const resolutionAction = actions.slice(
      actions.indexOf("export async function updateFailedDeliveryResolutionOperation"),
    );

    expect(resolutionAction).toContain(
      "retryReopened: result.retry_reopened === true",
    );
    expect(resolutionAction).toContain(
      "newState: result.retry_reopened === true ? RIDE_STATE.IN_DELIVERY : undefined",
    );
    expect(resolutionAction).not.toContain("nextRideId");
    expect(resolutionAction).not.toContain("redeliveryCreated");
  });
});
