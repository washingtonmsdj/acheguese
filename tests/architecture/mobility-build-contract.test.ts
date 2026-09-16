import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("mobility production build boundaries", () => {
  it("keeps quote-owned coordinates out of the browser ride creation contract", () => {
    const guards = read("src/core/mobility/core/RideOperationalGuards.ts");

    expect(guards).toContain("type RouteCoordinates");
    expect(guards).toContain("hasValidRouteCoordinates(input: RouteCoordinates)");
    expect(guards).not.toContain('Pick<CreateRideInput, "originLat"');
  });

  it("exports the canonical ride-share hook through the Safety SSOT", () => {
    const safetyHooks = read("src/core/safety/hooks/index.ts");
    const shareButton = read("src/modules/mobility/components/ShareRideButton.tsx");

    expect(safetyHooks).toContain("export * from './useRideShare';");
    expect(shareButton).toContain('import { useRideShare } from "@/core/safety";');
  });

  it("keeps the bounded ride projection explicit at the canonical adapter boundary", () => {
    const readModel = read("src/core/mobility/services/RideRequestReadModel.ts");

    expect(readModel).toContain(
      'row as unknown as Tables<"ride_requests">',
    );
    expect(readModel).not.toContain('row as Tables<"ride_requests">');
  });

  it("preserves literal admin history tones through spread inference", () => {
    const history = read("src/modules/admin/components/user-detail/HistoryTab.tsx");

    expect(history).toContain('tone: "info" as const');
    expect(history).toContain('tone: "success" as const');
    expect(history).toContain('tone: "destructive" as const');
  });
});
