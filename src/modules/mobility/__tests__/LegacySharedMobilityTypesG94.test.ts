import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G94 retired shared mobility types", () => {
  const rankingPanel = readProjectFile(
    "src/modules/mobility/components/NeighborRankingPanel.tsx",
  );

  it("physically removes the obsolete duplicated mobility type file", () => {
    expect(
      existsSync(resolve(process.cwd(), "src/shared/types/mobilidade.ts")),
    ).toBe(false);
  });

  it("keeps the only live NeighborRank contract local to its consumer", () => {
    expect(rankingPanel).toContain(
      'type NeighborRank = "bronze" | "prata" | "ouro" | "elite";',
    );
    expect(rankingPanel).not.toContain("@/shared/types/mobilidade");
  });

  it("does not revive retired driver plan or duplicated ride contracts", () => {
    for (const retiredMarker of [
      "DriverPlan",
      "subscription_plan",
      "total_earnings",
      "export interface Driver",
      "export interface RideRequest",
      "export interface DriverEarnings",
      "export interface DriverStats",
    ]) {
      expect(rankingPanel).not.toContain(retiredMarker);
    }
  });
});
