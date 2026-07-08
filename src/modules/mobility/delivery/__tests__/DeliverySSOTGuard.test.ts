import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("delivery ssot guard", () => {
  it("keeps motoboy delivery flow bound to ride_requests without legacy delivery_requests table", () => {
    const ssotServiceSource = readProjectFile(
      "src/core/mobility/delivery/services/OrderDeliverySSOTService.ts",
    );
    const linkServiceSource = readProjectFile(
      "src/core/mobility/delivery/services/OrderDeliveryLinkService.ts",
    );
    const checkoutSource = readProjectFile(
      "src/modules/business/gastronomy/hooks/useGastronomyCheckout.ts",
    );
    const centralLazyImportsSource = readProjectFile(
      "src/app/routes/centralLazyImports.ts",
    );
    const appLazyImportsSource = readProjectFile(
      "src/app/routes/lazyImports.ts",
    );

    expect(ssotServiceSource).toContain("OrderDeliveryNotificationService");
    expect(ssotServiceSource).toContain("private static notifyBestEffort");
    expect(ssotServiceSource).toContain('"createOrder"');
    expect(ssotServiceSource).toContain('"transitionLogisticsStatus"');
    expect(ssotServiceSource).toContain("taskFactory: () => Promise<void>");
    expect(ssotServiceSource).toContain("void taskFactory().catch");
    expect(ssotServiceSource).not.toContain(
      "await OrderDeliveryNotificationService.notifyOrderCreated(order)",
    );
    expect(ssotServiceSource).not.toContain(
      "await OrderDeliveryNotificationService.notifyOrderStatusChanged",
    );
    expect(ssotServiceSource).toContain("markPickedUp");
    expect(linkServiceSource).toContain("ride_requests");
    expect(checkoutSource).toContain("platform_courier");
    expect(checkoutSource).toContain(
      "Entrega por rede de motoboy ainda nao esta disponivel neste lancamento.",
    );
    expect(checkoutSource).not.toContain("requestDelivery(");
    expect(
      existsSync(
        resolve(
          repoRoot,
          "src/modules/business/gastronomy/pages/DeliveryManagementPage.tsx",
        ),
      ),
    ).toBe(false);
    expect(centralLazyImportsSource).toContain(
      'export const DeliveryManagementPage = createLaunchPausedRoute("Entregas")',
    );
    expect(appLazyImportsSource).toContain(
      'export const DeliveryManagementPage = createLaunchPausedRoute("Entregas")',
    );

    expect(ssotServiceSource).not.toMatch(
      /\.from\((['"])delivery_requests\1\)/,
    );
    expect(ssotServiceSource).not.toMatch(/delivery_requests\s*:/);
    expect(linkServiceSource).not.toMatch(
      /\.from\((['"])delivery_requests\1\)/,
    );
    expect(linkServiceSource).not.toMatch(/delivery_requests\s*:/);
    expect(checkoutSource).not.toMatch(/\.from\((['"])delivery_requests\1\)/);
    expect(checkoutSource).not.toMatch(/delivery_requests\s*:/);
  });
});
