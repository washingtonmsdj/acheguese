import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function projectPath(path: string): string {
  return resolve(process.cwd(), path);
}

function readProjectFile(path: string): string {
  return readFileSync(projectPath(path), "utf8");
}

describe("G142 driver registration mutation retirement", () => {
  const mutations = readProjectFile(
    "src/core/mobility/services/mobility.mutations.ts",
  );
  const driverService = readProjectFile(
    "src/core/mobility/services/DriverService.ts",
  );
  const facade = readProjectFile(
    "src/core/mobility/services/MobilityService.ts",
  );
  const runtime = readProjectFile(
    "src/core/mobility/services/MobilityRuntimeService.ts",
  );

  it("retires the split DriverService implementation path", () => {
    expect(
      existsSync(projectPath("src/core/mobility/services/DriverService.impl.ts")),
    ).toBe(false);
    expect(facade).toContain('from "./DriverService"');
    expect(facade).not.toContain("DriverService.impl");
  });

  it("removes the duplicate registration mutation and its broad fallback", () => {
    expect(mutations).not.toContain("export async function updateDriverData(");
    expect(mutations).not.toContain('.from("driver_data")\n        .select("*")');
    expect(mutations).not.toContain("sanitizeDriverSelfServiceUpdate");
  });

  it("removes the dead DriverService registration facade path", () => {
    expect(driverService).not.toContain("updateDriverRegistration(");
    expect(driverService).not.toContain("updateDriverData, updateDriverOnlineStatus");
  });

  it("removes the dead mutation from the public facade", () => {
    expect(facade).not.toContain("MobilityMutations.updateDriverData");
    expect(facade).not.toMatch(/\n\s*updateDriverData,\n/);
  });

  it("preserves the active runtime self-service update path", () => {
    expect(runtime).toContain("async updateDriverData(");
    expect(runtime).toContain("sanitizeDriverSelfServiceUpdate");
    expect(runtime).toContain('"update_owned_driver_data"');
  });
});
