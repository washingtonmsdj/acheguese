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

describe("G55 failed-delivery client snapshot boundary", () => {
  it("separates client snapshot input from persisted resolution metadata", () => {
    expect(types).toContain("export interface FailedDeliverySnapshotInput");
    expect(types).toContain("item_current_holder: 'driver'");
    expect(types).toContain("resolution_status: 'pending'");
    expect(types).toContain("export interface FailedDeliveryMetadata");
    expect(types).toContain("handoff_driver_profile_id?: string");
    expect(types).toContain("resolved_at?: string");
  });

  it("rejects server-owned resolution and custody fields in the initial snapshot", () => {
    expect(guards).toContain("FAILED_DELIVERY_SERVER_OWNED_FIELDS");
    expect(guards).toContain('"handoff_driver_profile_id"');
    expect(guards).toContain('"resolved_at"');
    expect(guards).toContain("item_current_holder deve permanecer driver");
    expect(guards).toContain("resolution_status deve iniciar como pending");
    expect(guards).toContain("Campo server-owned nao permitido no snapshot inicial");
  });

  it("builds only the strict initial snapshot shape", () => {
    expect(builder).toContain("FailedDeliverySnapshotInput");
    expect(builder).toContain('item_current_holder: "driver"');
    expect(builder).toContain('resolution_status: "pending"');
    expect(builder).not.toContain("DEFAULT_ITEM_HOLDER");
    expect(builder).not.toContain("DEFAULT_RESOLUTION_STATUS");
  });
});
