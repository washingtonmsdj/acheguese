import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("mobility operational notifications ssot", () => {
  it("keeps ride transition notifications transactional and audience-aware", () => {
    const source = readProjectFile("src/core/mobility/core/RideOperationalPostTransition.ts");

    expect(source).toContain("NotificationService.createNotification");
    expect(source).toContain('category: "transactional"');
    expect(source).toContain("audience");
    expect(source).toContain("ride_mode");
    expect(source).toContain("ride_canceled_by_driver");
    expect(source).toContain("ride_canceled_by_passenger");
    expect(source).toContain("mobilityRoutes.passageiro.buscando(rideId)");
  });
});
