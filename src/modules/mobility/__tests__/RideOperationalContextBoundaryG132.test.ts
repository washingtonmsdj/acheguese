import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G132 bounded operational ride contexts", () => {
  const reader = readProjectFile(
    "src/core/mobility/services/RideOperationalContextReadService.ts",
  );
  const dispatch = readProjectFile(
    "src/core/mobility/core/RideDispatchService.ts",
  );
  const delivery = readProjectFile(
    "src/core/mobility/core/RideDeliveryOperationalActions.ts",
  );
  const handoff = readProjectFile(
    "src/core/mobility/services/FailedDeliveryHandoffService.ts",
  );
  const admin = readProjectFile(
    "src/core/admin/services/AdminMotoboyOperationsService.ts",
  );

  it("keeps lifecycle decisions on a minimal explicit projection", () => {
    expect(reader).toContain(
      '"id, status, passenger_profile_id, driver_profile_id, ride_mode"',
    );
    expect(reader).toContain("failed_delivery_metadata");
    expect(reader).not.toContain('select("*")');
  });

  it("does not leak route, contact, proof or price into lifecycle context", () => {
    for (const forbidden of [
      "recipient_phone",
      "recipient_name",
      "origin_lat",
      "origin_lng",
      "destination_lat",
      "destination_lng",
      "proof_of_delivery",
      "suggested_price",
      "final_price",
      "delivery_notes",
    ]) {
      expect(reader).not.toContain(forbidden);
    }
  });

  it("routes dispatch, delivery, handoff and admin decisions through the bounded reader", () => {
    for (const source of [dispatch, delivery, handoff, admin]) {
      expect(source).toContain("RideOperationalContextReadService");
      expect(source).not.toContain("getRideById(");
    }
  });

  it("uses failed-delivery metadata only on the dedicated read path", () => {
    expect(delivery).toContain(
      "RideOperationalContextReadService.getFailedDelivery(rideId)",
    );
    expect(handoff).toContain(
      ".getFailedDelivery(rideId)",
    );
  });
});
