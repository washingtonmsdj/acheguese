import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G92 driver availability canonical coverage", () => {
  const layout = readProjectFile(
    "src/core/mobility/components/driver/DriverAvailabilityLayout.tsx",
  );

  it("reads territorial coverage from ServiceAreasService", () => {
    expect(layout).toContain('useServiceAreas(shell.driverProfileId ?? "")');
    expect(layout).toContain("primaryServiceArea?.location_full_name");
    expect(layout).toContain("primaryServiceArea?.radius_km");
    expect(layout).toContain("activeServiceAreas");
  });

  it("keeps GPS display on canonical availability timestamp only", () => {
    expect(layout).toContain("driverData?.last_location_update");
    expect(layout).toContain("Ultima atualizacao GPS");
    expect(layout).not.toContain("driverData?.current_location");
    expect(layout).not.toContain("JSON.stringify(driverData.current_location)");
  });

  it("does not revive retired driver_data coverage and schedule aliases", () => {
    for (const retiredAlias of [
      "search_radius_km",
      "max_search_radius_km",
      "service_neighborhoods",
      "driverData?.neighborhoods",
      "working_hours",
      "availability_hours",
      "Raio de atendimento",
      "Bairros atendidos",
      "Horarios",
    ]) {
      expect(layout).not.toContain(retiredAlias);
    }
  });
});
