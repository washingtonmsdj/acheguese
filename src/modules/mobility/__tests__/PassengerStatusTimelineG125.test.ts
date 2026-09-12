import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G125 passenger status timeline lifecycle", () => {
  const timeline = readProjectFile(
    "src/modules/mobility/components/StatusTimeline.tsx",
  );

  it("uses canonical lifecycle state instead of legacy status comparisons", () => {
    expect(timeline).toContain("toCanonicalRideState(ride.status)");
    expect(timeline).toContain("RIDE_STATE.DRIVER_ACCEPTED");
    expect(timeline).toContain("RIDE_STATE.DRIVER_ARRIVING");
    expect(timeline).toContain("RIDE_STATE.PASSENGER_BOARDED");
    expect(timeline).not.toContain("RIDE_STATUS.DRIVER_ON_THE_WAY");
    expect(timeline).not.toContain("RIDE_STATUS.DRIVER_ARRIVED");
    expect(timeline).not.toContain("RIDE_STATUS.PASSENGER_ON_BOARD");
  });

  it("does not present assignment as driver acceptance", () => {
    expect(timeline).toContain('label: "Motorista encontrado · aguardando confirmação"');
    expect(timeline).toContain('label: "Motorista confirmou"');
    expect(timeline).not.toContain('label: "Motorista Aceitou"');
  });

  it("uses the normalized acceptance timestamp and shared cancellation classifier", () => {
    expect(timeline).toContain("timestamp: ride.accepted_at");
    expect(timeline).toContain("isCancelledRideStatus(ride.status)");
  });
});
