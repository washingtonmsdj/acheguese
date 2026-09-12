import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G129 worker plan catalog authority", () => {
  const subscriptionCard = readProjectFile(
    "src/modules/mobility/components/driver/DriverSubscriptionCard.tsx",
  );
  const sidebar = readProjectFile(
    "src/modules/mobility/components/MobilidadeRightSidebar.tsx",
  );
  const driverPage = readProjectFile("src/modules/mobility/pages/MotoristaPage.tsx");
  const courierPage = readProjectFile("src/modules/mobility/pages/MotoboyPage.tsx");

  it("renders worker plans from the published catalog", () => {
    expect(subscriptionCard).toContain("CatalogService.getEligibleCatalog");
    expect(subscriptionCard).toContain('entity_family: "worker"');
    expect(subscriptionCard).toContain('pricing_model === "subscription"');
    expect(subscriptionCard).toContain("plan.item_code");
  });

  it("does not accept or fabricate a current worker plan in the client", () => {
    expect(subscriptionCard).not.toContain("currentPlan");
    expect(driverPage).not.toContain("currentPlan=");
    expect(courierPage).not.toContain("currentPlan=");
  });

  it("keeps the operational sidebar free of hardcoded subscription products", () => {
    expect(sidebar).not.toContain("Planos para Motorista");
    expect(sidebar).not.toContain("Prioritario");
    expect(sidebar).not.toContain("Padrao");
    expect(sidebar).not.toContain(">PRO<");
  });

  it("keeps checkout scoped to the selected worker vertical", () => {
    expect(subscriptionCard).toContain('subscriptionScope: "worker"');
    expect(subscriptionCard).toContain('entityFamily: "worker"');
    expect(subscriptionCard).toContain("vertical: config.vertical");
  });
});
