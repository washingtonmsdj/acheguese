import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

const types = readProjectFile(
  "src/core/mobility/types/FailedDeliveryMetadata.ts",
);
const guards = readProjectFile(
  "src/core/mobility/core/RideOperationalGuards.ts",
);
const builder = readProjectFile(
  "src/core/mobility/utils/failedDelivery.ts",
);
const deliveryActions = readProjectFile(
  "src/core/mobility/core/RideDeliveryOperationalActions.ts",
);
const serverAuthority = readProjectFile(
  "supabase/migrations/20260911222000_complete_delivery_in_single_transaction_g70.sql",
);

describe("G55 failed-delivery snapshot authority", () => {
  it("separates client snapshot input from persisted resolution metadata", () => {
    expect(types).toContain("export interface FailedDeliverySnapshotInput");
    expect(types).toContain("item_current_holder: 'driver'");
    expect(types).toContain("resolution_status: 'pending'");
    expect(types).toContain("export interface FailedDeliveryMetadata");
    expect(types).toContain("handoff_driver_profile_id?: string");
    expect(types).toContain("resolved_at?: string");
  });

  it("rejects server-owned resolution and custody fields before command dispatch", () => {
    expect(guards).toContain("FAILED_DELIVERY_SERVER_OWNED_FIELDS");
    expect(guards).toContain('"handoff_driver_profile_id"');
    expect(guards).toContain('"resolved_at"');
    expect(guards).toContain("item_current_holder deve permanecer driver");
    expect(guards).toContain("resolution_status deve iniciar como pending");
    expect(guards).toContain("Campo server-owned nao permitido no snapshot inicial");

    expect(deliveryActions).toContain("const snapshot: FailedDeliverySnapshotInput");
    expect(deliveryActions).toContain('item_current_holder: "driver"');
    expect(deliveryActions).toContain('resolution_status: "pending"');
    expect(deliveryActions).toContain("metadata: snapshot");
  });

  it("enforces the same snapshot boundary at the final privileged database command", () => {
    const failDeliveryGate = serverAuthority.slice(
      serverAuthority.indexOf("IF p_command = 'fail_delivery' THEN"),
      serverAuthority.indexOf("v_delivery := private.mobility_transition_delivery_state_atomic_base_g70"),
    );

    expect(failDeliveryGate).toContain("pg_catalog.jsonb_object_keys(p_failed_delivery_metadata)");
    expect(failDeliveryGate).toContain("failed delivery snapshot contains server-owned or unsupported fields");
    expect(failDeliveryGate).toContain("initial failed delivery custody must remain with driver");
    expect(failDeliveryGate).toContain("initial failed delivery resolution status must be pending");
    expect(failDeliveryGate).toContain("'failure_reason'");
    expect(failDeliveryGate).toContain("'failed_at_location'");
    expect(failDeliveryGate).not.toContain("'handoff_driver_profile_id'");
    expect(failDeliveryGate).not.toContain("'next_ride_id'");
    expect(failDeliveryGate).not.toContain("'resolved_at'");
    expect(failDeliveryGate).not.toContain("'resolution_action_notes'");
  });

  it("builds only the strict initial snapshot shape", () => {
    expect(builder).toContain("FailedDeliverySnapshotInput");
    expect(builder).toContain('item_current_holder: "driver"');
    expect(builder).toContain('resolution_status: "pending"');
    expect(builder).not.toContain("DEFAULT_ITEM_HOLDER");
    expect(builder).not.toContain("DEFAULT_RESOLUTION_STATUS");
  });
});
