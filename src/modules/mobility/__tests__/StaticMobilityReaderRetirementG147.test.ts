import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G147/G151 retired static mobility compatibility service", () => {
  const implPath = resolve(
    process.cwd(),
    "src/core/mobility/services/MobilityService.impl.ts",
  );
  const functionalQueries = readProjectFile(
    "src/core/mobility/services/mobility.queries.ts",
  );
  const driverQueries = readProjectFile(
    "src/core/mobility/services/MobilityServiceDriverQueries.ts",
  );
  const runtimeEntrypoint = readProjectFile(
    "src/core/mobility/services/runtime.ts",
  );

  it("removes the compatibility implementation after its final command moved", () => {
    expect(existsSync(implPath)).toBe(false);
    expect(runtimeEntrypoint).toContain(
      "export { mobilityService } from '@/core/mobility/services/MobilityRuntimeService';",
    );
    expect(runtimeEntrypoint).not.toContain("MobilityService.impl");
  });

  it("keeps active dedicated readers and retires the service-only summary RPC caller", () => {
    expect(functionalQueries).toContain("export async function getActiveRideByDriverProfile(");
    expect(functionalQueries).toContain("export async function getRideDispatchData(");
    expect(driverQueries).not.toContain("get_driver_dispatch_summaries");
    expect(driverQueries).not.toContain("export async function getDriverDataByProfileIds(");
    expect(driverQueries).toContain("export async function getMobilityStats(");
    expect(driverQueries).toContain("export async function getCompletedRidePaymentsByDriver(");
    expect(driverQueries).toContain("export async function getPassengerRating(");
  });
});
