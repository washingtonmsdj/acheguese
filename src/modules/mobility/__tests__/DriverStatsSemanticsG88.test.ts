import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G88 driver stats semantics", () => {
  const compact = readProjectFile(
    "src/modules/mobility/components/driver/DriverStatsCompact.tsx",
  );
  const card = readProjectFile(
    "src/modules/mobility/components/driver/DriverStatsCard.tsx",
  );
  const suspension = readProjectFile(
    "src/modules/mobility/components/driver/DriverSuspensionAlert.tsx",
  );

  it("resolves a driver from the canonical session user/profile identity", () => {
    for (const source of [compact, card]) {
      expect(source).toContain('activeProfile.profileType === "driver"');
      expect(source).toContain("activeProfile.userId");
      expect(source).not.toContain("getProfileByType(\n        activeProfile.id");
    }
  });

  it("derives completion from completed rides instead of acceptance rate", () => {
    for (const source of [compact, card]) {
      expect(source).toContain("completedRides / totalRides");
      expect(source).not.toContain("completion_rate: Number(driverData.acceptance_rate");
      expect(source).not.toContain("completion_rate = Number(data.acceptance_rate");
    }
  });

  it("does not invent a local dispatch priority score", () => {
    expect(compact).not.toContain("priority_score");
    expect(card).not.toContain("priority_score");
    expect(card).not.toContain("prioridade no sistema de match");
  });

  it("shows only real suspension state instead of a local 30 percent policy", () => {
    expect(suspension).not.toContain("cancellation_rate > 25");
    expect(suspension).not.toContain("cancellation_rate <= 30");
    expect(suspension).not.toContain("Acima de 30%");
    expect(suspension).not.toContain("limite de 30%");
    expect(suspension).toContain("!status?.is_suspended");
    expect(suspension).toContain('"Sem prazo definido"');
  });

  it("reconciles expired suspension from an effect, not during render", () => {
    expect(suspension).toContain("if (!suspensionExpired || !driverProfileId) return;");
    expect(suspension).toContain(".checkSuspensionExpiry(driverProfileId)");
  });
});
