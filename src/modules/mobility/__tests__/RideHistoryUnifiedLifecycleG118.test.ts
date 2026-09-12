import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G118 unified ride history lifecycle", () => {
  const history = readProjectFile(
    "src/modules/mobility/components/RideHistoryUnified.tsx",
  );

  it("uses canonical closed and cancellation classifiers", () => {
    expect(history).toContain("isClosedRideStatus(ride.status)");
    expect(history).toContain("isCancelledRideStatus(ride.status)");
    expect(history).not.toContain(
      "r.status === RIDE_STATUS.COMPLETED || r.status === RIDE_STATUS.CANCELLED",
    );
  });

  it("presents the raw closed lifecycle status through the canonical badge", () => {
    expect(history).toContain('<StatusBadge status={ride.status} size="sm" />');
  });

  it("does not present an estimate as realized spend or final value", () => {
    expect(history).toContain("sum + (ride.final_price ?? 0)");
    expect(history).toContain(
      'ride.final_price == null ? "—" : formatBrl(ride.final_price)',
    );
    expect(history).not.toContain(
      "ride.final_price || ride.suggested_price || 0",
    );
  });

  it("treats the cancelled UI filter as a category", () => {
    expect(history).toContain(
      'filterStatus === "cancelled" && !isCancelledRideStatus(ride.status)',
    );
  });
});
