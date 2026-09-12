import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G96 canonical ride status schema", () => {
  const schemas = readProjectFile(
    "src/core/mobility/schemas/mobilitySchemas.ts",
  );

  it("accepts every status declared by the canonical RIDE_STATUS contract", () => {
    const expectedMarkers = [
      "RIDE_STATUS.PENDING",
      "RIDE_STATUS.REQUESTED",
      "RIDE_STATUS.SEARCHING_DRIVER",
      "RIDE_STATUS.DRIVER_ASSIGNED",
      "RIDE_STATUS.DRIVER_ACCEPTED",
      "RIDE_STATUS.DRIVER_ARRIVING",
      "RIDE_STATUS.DRIVER_ON_THE_WAY",
      "RIDE_STATUS.DRIVER_ARRIVED",
      "RIDE_STATUS.PASSENGER_BOARDED",
      "RIDE_STATUS.PASSENGER_ON_BOARD",
      "RIDE_STATUS.IN_PROGRESS",
      "RIDE_STATUS.PICKUP_CONFIRMED",
      "RIDE_STATUS.IN_DELIVERY",
      "RIDE_STATUS.DELIVERED",
      "RIDE_STATUS.FAILED_DELIVERY",
      "RIDE_STATUS.COMPLETED",
      "RIDE_STATUS.CANCELLED",
      "RIDE_STATUS.CANCELLED_BY_PASSENGER",
      "RIDE_STATUS.CANCELLED_BY_DRIVER",
      "RIDE_STATUS.EXPIRED",
      "RIDE_STATUS.FAILED",
    ] as const;

    const start = schemas.indexOf("export const RideStatusSchema = z.enum([");
    const end = schemas.indexOf("]);", start);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);

    const statusSchema = schemas.slice(start, end);
    for (const marker of expectedMarkers) {
      expect(statusSchema).toContain(marker);
    }
  });

  it("keeps ride request and filter schemas bound to RideStatusSchema", () => {
    expect(schemas).toContain("status: RideStatusSchema");
    expect(schemas).toContain(
      'status: z.union([RideStatusSchema, z.literal("all")])',
    );
  });
});
