import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G130 global ride scan retirement", () => {
  const facade = readProjectFile("src/core/mobility/services/MobilityService.ts");
  const queries = readProjectFile("src/core/mobility/services/mobility.queries.ts");
  const legacyImpl = readProjectFile("src/core/mobility/services/MobilityService.impl.ts");
  const validation = readProjectFile("tools/maintenance/validate-mobility-dispatch.ts");

  it("does not expose generic global ride readers", () => {
    for (const source of [facade, queries, legacyImpl]) {
      expect(source).not.toContain("getAllRideRequests");
      expect(source).not.toContain("getActiveRides");
    }
  });

  it("keeps dispatch validation on bounded projections", () => {
    expect(validation).not.toContain("getAllRideRequests");
    expect(validation).not.toContain('select("*")');
    expect(validation).toContain('select("id, status, created_at")');
    expect(validation).toContain("QUERYABLE_PRE_ACCEPT_RIDE_STATUSES");
    expect(validation).toContain(".limit(50)");
  });

  it("checks availability through driver_availability instead of driver_data", () => {
    expect(validation).toContain('.from("driver_availability")');
    expect(validation).toContain('.eq("is_online", true)');
    expect(validation).toContain('.eq("is_available", true)');
  });
});
