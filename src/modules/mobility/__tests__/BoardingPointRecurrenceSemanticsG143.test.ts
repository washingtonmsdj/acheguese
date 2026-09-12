import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G143 boarding point recurrence semantics", () => {
  const service = readProjectFile(
    "src/core/mobility/services/BoardingPointService.ts",
  );
  const panel = readProjectFile(
    "src/modules/mobility/components/BoardingPointsPanel.tsx",
  );

  it("names the service according to the recent bounded sample", () => {
    expect(service).toContain("listRecentFrequentPoints");
    expect(service).toContain("RECENT_BOARDING_POINT_SAMPLE_LIMIT = 300");
    expect(service).not.toContain("listMostUsedPoints");
  });

  it("does not invent a global popularity threshold", () => {
    expect(service).not.toContain("popular:");
    expect(service).not.toContain("ridesCount >= 5");
    expect(panel).not.toContain("point.popular");
    expect(panel).not.toContain(">Popular<");
  });

  it("labels counts as recent-sample occurrences", () => {
    expect(panel).toContain("listRecentFrequentPoints(20)");
    expect(panel).toContain("ocorrencias na amostra recente");
    expect(panel).not.toContain("corridas neste ponto");
  });
});
