import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function sliceBetween(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return source.slice(startIndex, endIndex);
}

const g73Migration = readProjectFile(
  "supabase/migrations/20260911152000_redact_driver_history_and_derive_feedback_targets_g73.sql",
);
const g74Migration = readProjectFile(
  "supabase/migrations/20260911160000_server_owned_driver_earnings_read_model_g74.sql",
);
const mobilityRpc = readProjectFile("supabase/functions/mobility-rpc/index.ts");
const historyService = readProjectFile(
  "src/core/mobility/services/DriverRideHistoryReadService.ts",
);
const earningsService = readProjectFile(
  "src/core/mobility/services/DriverEarningsReadService.ts",
);
const queries = readProjectFile(
  "src/core/mobility/services/mobility.queries.ts",
);
const runtimeService = readProjectFile(
  "src/core/mobility/services/MobilityRuntimeService.ts",
);
const driverQueries = readProjectFile(
  "src/core/mobility/services/MobilityServiceDriverQueries.ts",
);
const driverOffers = readProjectFile(
  "src/modules/mobility/hooks/useDriverOffers.ts",
);
const feedbackPanel = readProjectFile(
  "src/core/mobility/components/driver/DriverTrustFeedbackPanel.tsx",
);
const trustCommand = readProjectFile(
  "src/core/trust/services/OperationalTrustCommandService.ts",
);

describe("G73/G74 private driver read models", () => {
  it("keeps terminal driver history service-role-only and user-owned", () => {
    expect(g73Migration).toContain(
      "CREATE OR REPLACE FUNCTION public.mobility_get_driver_ride_history",
    );
    expect(g73Migration).toContain("p_actor_user_id uuid");
    expect(g73Migration).toContain("profile.user_id = p_actor_user_id");
    expect(g73Migration).toContain(
      "FROM PUBLIC, anon, authenticated",
    );
    expect(g73Migration).toContain("TO service_role;");
    expect(g73Migration).not.toContain(
      "GRANT EXECUTE ON FUNCTION public.mobility_get_driver_ride_history(uuid, integer, integer)\n  TO authenticated",
    );

    const historyJson = sliceBetween(
      g73Migration,
      "pg_catalog.jsonb_build_object(\n          'id'",
      "RETURN pg_catalog.jsonb_build_object('rides'",
    );
    for (const forbidden of [
      "recipient_name",
      "recipient_phone",
      "passenger_profile_id",
      "driver_profile_id",
      "source_id",
      "package_description",
      "delivery_notes",
      "observation",
      "origin_lat",
      "origin_lng",
      "destination_lat",
      "destination_lng",
    ]) {
      expect(historyJson).not.toContain(`'${forbidden}'`);
    }
  });

  it("derives the authenticated driver inside mobility-rpc for history", () => {
    const handler = sliceBetween(
      mobilityRpc,
      "async function handleGetDriverRideHistory(",
      "async function handleGetDriverEarningsHistory(",
    );
    expect(handler).toContain('"mobility_get_driver_ride_history"');
    expect(handler).toContain("p_actor_user_id: auth.userId");
    expect(handler).not.toContain("driverProfileId");
    expect(handler).not.toContain("driver_profile_id");

    expect(historyService).toContain('action: "getDriverRideHistory"');
    expect(historyService).toContain('functionName: FUNCTION_NAME');
    expect(historyService).not.toContain('from("ride_requests")');
    expect(historyService).not.toContain("p_driver_profile_id");
    expect(historyService).not.toContain("driverProfileId: _driverProfileId");
  });

  it("composes only accepted open rides with redacted terminal history", () => {
    expect(queries).toContain("DRIVER_OWNED_OPEN_RIDE_STATUSES");
    expect(queries).toContain("DriverRideHistoryReadService.list(driverProfileId)");
    expect(queries).toContain('.in("status", DRIVER_OWNED_OPEN_RIDE_STATUSES)');
  });

  it("keeps preaccept offers on the canonical redacted broker", () => {
    expect(driverOffers).toContain("MobilityOfferService.getExclusiveOffer");
    expect(driverOffers).not.toContain("getRideWithAddresses");
    expect(driverOffers).not.toContain("getRidesByDriverProfile");
  });

  it("derives ride feedback targets server-side instead of sending profile UUIDs", () => {
    expect(g73Migration).toContain("p_subject_role text");
    expect(g73Migration).toContain("v_subject_profile_id := v_ride.driver_profile_id");
    expect(g73Migration).toContain("v_subject_profile_id := v_ride.passenger_profile_id");
    expect(trustCommand).toContain("p_subject_role: input.subjectRole");
    expect(feedbackPanel).not.toContain("OrderDeliverySSOTService");
    expect(feedbackPanel).not.toContain("passenger_profile_id");
    expect(feedbackPanel).not.toContain("source_id");
  });

  it("keeps driver earnings service-role-only and custody-attributed", () => {
    expect(g74Migration).toContain(
      "CREATE OR REPLACE FUNCTION public.mobility_get_driver_earnings_history",
    );
    expect(g74Migration).toContain("p_actor_user_id uuid");
    expect(g74Migration).toContain("profile.user_id = p_actor_user_id");
    expect(g74Migration).toContain("handoff_to_another_driver");
    expect(g74Migration).toContain("courier_settlement_allocation_required");
    expect(g74Migration).toContain("custody_handoff_history");
    expect(g74Migration).toContain("TO service_role;");
    expect(g74Migration).not.toContain(
      "GRANT EXECUTE ON FUNCTION public.mobility_get_driver_earnings_history(\n  uuid, timestamptz, integer\n) TO authenticated",
    );
  });

  it("routes every driver earnings consumer through the private broker read model", () => {
    const handler = sliceBetween(
      mobilityRpc,
      "async function handleGetDriverEarningsHistory(",
      "async function handleCreateDriverProfile(",
    );
    expect(handler).toContain('"mobility_get_driver_earnings_history"');
    expect(handler).toContain("p_actor_user_id: auth.userId");
    expect(handler).not.toContain("driverProfileId");
    expect(handler).not.toContain("driver_profile_id");

    expect(earningsService).toContain('action: "getDriverEarningsHistory"');
    expect(earningsService).not.toContain('from("ride_requests")');
    expect(earningsService).not.toContain("p_driver_profile_id");
    expect(runtimeService).toContain("DriverEarningsReadService.total(driverProfileId");
    expect(driverQueries).toContain("DriverEarningsReadService.list(driverProfileId");
  });
});
