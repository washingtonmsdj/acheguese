import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G93 truthful admin driver metrics", () => {
  const driverTypes = readProjectFile(
    "src/core/admin/drivers/sections/types.ts",
  );
  const managementHook = readProjectFile(
    "src/core/admin/drivers/hooks/useDriverManagement.ts",
  );
  const tabs = readProjectFile(
    "src/core/admin/drivers/sections/AdminMotoristasTabsSection.tsx",
  );
  const statsCalculator = readProjectFile(
    "src/core/admin/drivers/utils/statsCalculator.ts",
  );
  const statsSection = readProjectFile(
    "src/core/admin/drivers/sections/AdminMotoristasStatsSection.tsx",
  );
  const infoCard = readProjectFile(
    "src/core/admin/drivers/components/cards/DriverInfoCard.tsx",
  );
  const operationalMetrics = readProjectFile(
    "src/core/admin/components/DriverOperationalMetrics.tsx",
  );
  const componentIndex = readProjectFile(
    "src/core/admin/components/index.ts",
  );

  it("does not fabricate driver earnings periods or platform revenue", () => {
    for (const source of [tabs, statsCalculator, statsSection, operationalMetrics]) {
      expect(source).not.toContain("earnings_today");
      expect(source).not.toContain("earnings_week");
      expect(source).not.toContain("earnings_month");
      expect(source).not.toContain("* 0.1");
      expect(source).not.toContain("* 0.3");
      expect(source).not.toContain("total_earnings");
    }

    expect(statsSection).not.toContain('label: "Receita"');
    expect(operationalMetrics).not.toContain("Faturamento");
  });

  it("removes the invented driver subscription plan from admin DTO and UI", () => {
    expect(driverTypes).not.toContain("subscription_plan");
    expect(managementHook).not.toContain("subscription_plan");
    expect(infoCard).not.toContain("subscription_plan");
    expect(infoCard).not.toContain(">Plano<");
    expect(operationalMetrics).not.toContain("prioritario");
    expect(operationalMetrics).not.toContain("premium");
  });

  it("keeps admin metrics on existing operational facts", () => {
    expect(tabs).toContain("DriverOperationalMetrics");
    expect(operationalMetrics).toContain("driver.is_online");
    expect(operationalMetrics).toContain("driver.total_rides");
    expect(operationalMetrics).toContain("driver.rating");
    expect(operationalMetrics).toContain("Online agora");
    expect(operationalMetrics).toContain("Corridas registradas");
  });

  it("physically retires the fabricated earnings component", () => {
    const retiredPath = resolve(
      process.cwd(),
      "src/core/admin/components/DriverEarningsMetrics.tsx",
    );
    expect(existsSync(retiredPath)).toBe(false);
    expect(componentIndex).not.toContain("DriverEarningsMetrics");
    expect(componentIndex).toContain("DriverOperationalMetrics");
  });
});
