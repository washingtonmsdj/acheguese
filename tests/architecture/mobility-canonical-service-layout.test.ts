import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const pathOf = (path: string) => resolve(root, path);
const read = (path: string) => readFileSync(pathOf(path), "utf8");

describe("Mobility canonical service layout", () => {
  it("keeps Driver, Ride and Chat services in their canonical public files", () => {
    for (const retired of [
      "src/core/mobility/services/DriverService.impl.ts",
      "src/core/mobility/services/RideService.impl.ts",
      "src/core/mobility/services/ChatService.impl.ts",
      "src/core/mobility/services/MobilityService.impl.ts",
    ]) {
      expect(existsSync(pathOf(retired))).toBe(false);
    }

    expect(read("src/core/mobility/services/DriverService.ts")).toContain(
      "export class DriverService",
    );
    expect(read("src/core/mobility/services/RideService.ts")).toContain(
      "export class RideService",
    );
    expect(read("src/core/mobility/services/ChatService.ts")).toContain(
      "export class ChatService",
    );
  });

  it("keeps the mobility facade free of retired impl imports", () => {
    const facade = read("src/core/mobility/services/MobilityService.ts");
    expect(facade).not.toContain("Service.impl");
    expect(facade).toContain('from "./DriverService"');
    expect(facade).toContain('from "./RideService"');
    expect(facade).toContain('from "./ChatService"');
  });

  it("does not restore the retired shareRide no-op", () => {
    const ride = read("src/core/mobility/services/RideService.ts");
    expect(ride).not.toContain("shareRide(");
    expect(ride).not.toContain("Future implementation");
  });
});
