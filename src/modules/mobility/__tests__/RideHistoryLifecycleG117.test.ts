import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G117 ride history lifecycle", () => {
  const activeHook = readProjectFile(
    "src/modules/mobility/hooks/useActiveRide.ts",
  );
  const historyHook = readProjectFile(
    "src/modules/mobility/hooks/useRideHistory.ts",
  );

  it("derives active rides from the canonical open-state classifier", () => {
    expect(activeHook).toContain("isOpenRideStatus(ride.status)");
    expect(activeHook).not.toContain("activeStatuses");
    expect(activeHook).not.toContain("RIDE_STATUS.PENDING");
  });

  it("keeps the history boundary closed and cancellation-aware", () => {
    expect(historyHook).toContain("isClosedRideStatus(ride.status)");
    expect(historyHook).toContain("isCancelledRideStatus(ride.status)");
    expect(historyHook).not.toContain("const cancelledStatuses");
  });

  it("never substitutes an estimate for realized spend", () => {
    expect(historyHook).toContain("final_price: ride.final_price ?? 0");
    expect(historyHook).toContain(
      ".reduce((sum, ride) => sum + (ride.final_price ?? 0), 0)",
    );
    expect(historyHook).not.toContain(
      "r.final_price || r.estimated_price || 0",
    );
  });

  it("computes summary stats before paginating the visible list", () => {
    const statsIndex = historyHook.indexOf("const stats = {");
    const paginationIndex = historyHook.indexOf("let visibleRides = filteredRides");
    expect(statsIndex).toBeGreaterThan(-1);
    expect(paginationIndex).toBeGreaterThan(statsIndex);
  });
});
