import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G134 order delivery tracking boundary", () => {
  const reader = readProjectFile(
    "src/core/mobility/delivery/services/OrderDeliveryLinkReadService.ts",
  );
  const service = readProjectFile(
    "src/core/mobility/delivery/services/OrderDeliveryLinkService.ts",
  );
  const hook = readProjectFile(
    "src/modules/business/gastronomy/hooks/useOrderTracking.ts",
  );
  const card = readProjectFile(
    "src/modules/business/gastronomy/components/orders/OrderTrackingCard.tsx",
  );

  it("uses an explicit delivery-link projection instead of a full ride row", () => {
    expect(reader).not.toContain('select("*")');
    for (const field of [
      '"id"',
      '"status"',
      '"source_type"',
      '"source_id"',
      '"ride_mode"',
      '"passenger_profile_id"',
      '"driver_profile_id"',
      '"origin_lat"',
      '"origin_lng"',
      '"destination_lat"',
      '"destination_lng"',
      '"final_price"',
      '"suggested_price"',
    ]) {
      expect(reader).toContain(field);
    }
  });

  it("keeps unrelated delivery PII and failure metadata out of the link snapshot", () => {
    for (const forbidden of [
      "recipient_phone",
      "recipient_name",
      "delivery_notes",
      "package_description",
      "failed_delivery_metadata",
      "failed_delivery_reason",
    ]) {
      expect(reader).not.toContain(forbidden);
    }
  });

  it("does not fall back to generic MobilityService ride readers", () => {
    expect(service).toContain("OrderDeliveryLinkReadService");
    expect(service).not.toContain("MobilityService.getRideById");
    expect(service).not.toContain("MobilityService.getLatestRideBySource");
    expect(service).not.toContain("MobilityService.getRideSourceIdById");
  });

  it("derives active state from shared lifecycle authority", () => {
    expect(hook).toContain("isOpenRideStatus");
    expect(hook).not.toContain("ACTIVE_TRACKING_STATUSES");
    expect(hook).not.toContain("RideRequest");
  });

  it("never mounts precise tracking at driver_assigned preaccept", () => {
    expect(card).toContain("isDriverOwnedOpenRideStatus(rideRequest.status)");
    expect(card).toContain("{canTrackDriver && rideRequest && hasRouteCoordinates && (");
    expect(card).not.toContain("estimated_duration");
    expect(card).not.toContain("driver_profile.");
  });
});
