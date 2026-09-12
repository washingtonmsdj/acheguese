import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "supabase/functions/user-export-data/index.ts"),
  "utf8",
);

function sliceBetween(start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return source.slice(startIndex, endIndex);
}

describe("G89 LGPD driver presence export authority", () => {
  it("keeps operational presence out of the driver_data export projection", () => {
    const driverDataExport = sliceBetween(
      'const driverData = await requireProfileRows(',
      'const driverProfiles = await requireProfileRows(',
    );

    expect(driverDataExport).toContain('"driver_data"');
    expect(driverDataExport).not.toContain("is_online");
    expect(driverDataExport).not.toContain("is_available");
  });

  it("exports operational presence from driver_availability instead", () => {
    const availabilityExport = sliceBetween(
      'const driverAvailability = await requireProfileRows(',
      'const driverRoutes = await requireProfileRows(',
    );

    for (const field of [
      "profile_id",
      "is_online",
      "is_available",
      "last_location_update",
      "last_seen_at",
      "active_ride_id",
      "busy_since",
      "active_ride_mode",
    ]) {
      expect(availabilityExport).toContain(field);
    }
  });

  it("does not promote the uncertified export rollout", () => {
    expect(source).toContain(
      "const LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE = false;",
    );
    expect(source).not.toContain(
      "const LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE = true;",
    );
  });
});
