import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function sliceBetween(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return source.slice(startIndex, endIndex);
}

describe("G87 driver runtime projections", () => {
  const queries = readProjectFile(
    "src/core/mobility/services/mobility.queries.ts",
  );

  it("does not read the full driver_data row for the runtime driver summary", () => {
    const source = sliceBetween(
      queries,
      "export async function getDriverData(profileId: string)",
      "/**\n * Estatisticas do motorista",
    );

    expect(source).not.toContain('.select("*")');
    expect(source).toContain(
      '.select("profile_id, rating, total_rides, is_verified, created_at, updated_at")',
    );
  });

  it("does not read the full driver_data row for detailed driver stats", () => {
    const source = sliceBetween(
      queries,
      "export async function getDriverStatsDetailed(driverProfileId: string)",
      "export async function getMotoboyRuntimeDatabaseChecks",
    );

    expect(source).not.toContain('.select("*")');
    expect(source).toContain("total_rides_completed");
    expect(source).toContain("acceptance_rate");
    expect(source).toContain("can_do_delivery");
  });

  it("keeps operational presence fields out of both driver_data projections", () => {
    const source = sliceBetween(
      queries,
      "export async function getDriverData(profileId: string)",
      "export async function getMotoboyRuntimeDatabaseChecks",
    );

    for (const retiredPresenceField of [
      "is_online",
      "is_available",
      "current_location",
      "current_lat",
      "current_lng",
      "last_location_update",
      "last_seen_at",
      "active_ride_id",
      "active_ride_mode",
    ]) {
      expect(source).not.toContain(retiredPresenceField);
    }
  });
});
