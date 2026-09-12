import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G151 driver availability ownership", () => {
  const availability = readProjectFile(
    "src/core/mobility/services/DriverAvailabilityService.ts",
  );
  const runtime = readProjectFile("src/core/mobility/services/runtime.ts");
  const facade = readProjectFile("src/core/mobility/services/MobilityService.ts");
  const publicIndex = readProjectFile("src/core/mobility/services/index.ts");

  it("owns driver-data bootstrap inside DriverAvailabilityService", () => {
    expect(availability).toContain("'ensure_owned_driver_data'");
    expect(availability).toContain("await this.ensureDriverDataRow(driverProfileId)");
    expect(availability).not.toContain("MobilityService.impl");
  });

  it("reads availability through an explicit operational projection", () => {
    expect(availability).toContain(
      "'profile_id, is_online, is_available, current_lat, current_lng, last_location_update, last_seen_at, active_ride_id, busy_since, active_ride_mode, updated_at'",
    );
    expect(availability).not.toContain(".select('*')");
  });

  it("does not restore the retired compatibility implementation", () => {
    expect(
      existsSync(
        resolve(process.cwd(), "src/core/mobility/services/MobilityService.impl.ts"),
      ),
    ).toBe(false);
    expect(runtime).not.toContain("MobilityService.impl");
    expect(facade).not.toContain("MobilityService.impl");
    expect(publicIndex).not.toContain("MobilityService.impl");
  });

  it("exports the runtime singleton from its real owner", () => {
    expect(runtime).toContain("MobilityRuntimeService");
    expect(facade).toContain('export { mobilityService } from "./MobilityRuntimeService";');
    expect(publicIndex).toContain("MobilityRuntimeService");
  });
});
