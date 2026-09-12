import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G141 ride state audit reader retirement", () => {
  const rideReads = readProjectFile(
    "src/core/mobility/services/mobility.ride-read-queries.ts",
  );
  const queries = readProjectFile(
    "src/core/mobility/services/mobility.queries.ts",
  );

  it("removes the unused broad ride state audit reader", () => {
    expect(rideReads).not.toContain("getRideStateAuditEntries");
    expect(rideReads).not.toContain('from<RideStateAuditRow>("ride_state_audit")');
    expect(rideReads).not.toContain('from("ride_state_audit")');
  });

  it("removes the dead public reexport", () => {
    expect(queries).not.toContain("getRideStateAuditEntries");
  });
});
