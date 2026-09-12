import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G124 delivery lifecycle authority", () => {
  const hook = readProjectFile("src/modules/mobility/hooks/useDelivery.ts");

  it("removes the delivery-local active status array", () => {
    expect(hook).not.toContain("ACTIVE_DELIVERY_STATES");
    expect(hook).toContain('import { isOpenRideStatus } from "@/core/mobility/core/RideLifecycleStatus"');
  });

  it("derives the active delivery from the canonical lifecycle", () => {
    expect(hook).toContain("filtered.find((r: RideRequest) => isOpenRideStatus(r.status))");
    expect(hook).toContain("setActiveDelivery(active ?? null)");
  });

  it("clears terminal deliveries after any realtime refetch", () => {
    expect(hook).toContain("updated && isOpenRideStatus(updated.status) ? updated : null");
    expect(hook).not.toContain("if (updated) setActiveDelivery(updated)");
  });
});
