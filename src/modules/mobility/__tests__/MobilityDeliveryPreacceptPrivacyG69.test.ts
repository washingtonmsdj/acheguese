import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

const g69 = readProjectFile(
  "supabase/migrations/20260911221000_harden_preaccept_ride_and_delivery_offer_privacy_g69.sql",
);
const reconciliation = readProjectFile(
  "supabase/migrations/20260911223000_reconcile_ride_participant_privacy_g69_g73.sql",
);
const dashboard = readProjectFile(
  "src/core/mobility/hooks/useDriverDashboardBase.ts",
);
const offerService = readProjectFile(
  "src/core/mobility/services/MobilityOfferService.ts",
);
const rpcService = readProjectFile(
  "src/core/mobility/services/MobilityRpcService.ts",
);
const dispatchTypes = readProjectFile(
  "src/core/mobility/types/dispatch.types.ts",
);

describe("G69 pre-accept ride and delivery privacy", () => {
  it("does not treat driver assignment as accepted participant access", () => {
    const participantPolicy = g69.slice(
      g69.indexOf('ALTER POLICY "Ride participants view"'),
      g69.indexOf("-- G60 already coarse-grained"),
    );

    expect(participantPolicy).toContain("driver_profile_id IN");
    expect(participantPolicy).toContain("'driver_accepted'");
    expect(participantPolicy).not.toContain("'driver_assigned'");
  });

  it("removes internal ids and requester-controlled package text from preaccept offers", () => {
    expect(g69).toContain("'passenger_profile_id'");
    expect(g69).toContain("'source_id'");
    expect(g69).toContain("'package_description'");
    expect(g69).toContain("raw.value - ARRAY[");
    expect(g69).toContain("'location_precision', 'coarse_2dp'");
  });

  it("makes the browser offer domain anonymous instead of rehydrating removed ids", () => {
    expect(offerService).not.toContain("profileService");
    expect(offerService).not.toContain("passenger_profile_id");
    expect(offerService).not.toContain("package_description");
    expect(offerService).not.toContain("source_id");
    expect(offerService).toContain("hasCoarseLocationContract");
    expect(offerService).toContain("locationPrecision: 'coarse_2dp'");

    const brokerOfferType = rpcService.slice(
      rpcService.indexOf("export interface DriverOfferBrokerRow"),
      rpcService.indexOf("export interface DriverOffersBrokerData"),
    );
    expect(brokerOfferType).not.toContain("passenger_profile_id");
    expect(brokerOfferType).not.toContain("package_description");
    expect(brokerOfferType).not.toContain("source_id");
    expect(brokerOfferType).toContain('location_precision: "coarse_2dp"');
  });

  it("marks sensitive preaccept properties as impossible in public dispatch types", () => {
    expect(dispatchTypes).toContain("passengerName?: never");
    expect(dispatchTypes).toContain("passengerPhone?: never");
    expect(dispatchTypes).toContain("packageDescription?: never");
    expect(dispatchTypes).toContain("customerName?: never");
    expect(dispatchTypes).toContain("customerPhone?: never");
    expect(dispatchTypes).toContain("locationPrecision: 'coarse_2dp'");
  });

  it("keeps offer discovery on the broker instead of direct ride table reads", () => {
    expect(dashboard).toContain("MobilityOfferService.getExclusiveOffer");
    expect(dashboard).toContain("MobilityOfferService.getOpenBoardOffers");
    expect(dashboard).not.toContain("getAvailableRides(");
  });

  it("keeps the redacted offer boundary service-role only", () => {
    expect(g69).toContain("service_role or postgres session is required");
    expect(g69).toContain("FROM PUBLIC, anon, authenticated");
    expect(g69).toContain("TO service_role");
  });

  it("reasserts the stricter G73 terminal-history policy after the new integration", () => {
    expect(reconciliation).toContain('ALTER POLICY "Ride participants view"');
    expect(reconciliation).toContain("'driver_accepted'");
    expect(reconciliation).toContain("'failed_delivery'");
    expect(reconciliation).not.toContain("'driver_assigned'");
    expect(reconciliation).not.toContain("'completed'");
    expect(reconciliation).not.toContain("'delivered'");
    expect(reconciliation).not.toContain("'cancelled_by_driver'");
  });
});
