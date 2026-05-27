import { readFileSync } from "node:fs";
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
    const deliveryManagementSource = readProjectFile(
      "src/modules/business/gastronomy/pages/DeliveryManagementPage.tsx",
    );

    expect(ssotServiceSource).toContain("OrderDeliveryNotificationService");
    expect(ssotServiceSource).toContain("markPickedUp");
    expect(linkServiceSource).toContain("ride_requests");
    expect(checkoutSource).toContain("requestDelivery");
    expect(deliveryManagementSource).toContain("ride_mode='motoboy'");

    expect(ssotServiceSource).not.toMatch(/\.from\((['"])delivery_requests\1\)/);
    expect(ssotServiceSource).not.toMatch(/delivery_requests\s*:/);
    expect(linkServiceSource).not.toMatch(/\.from\((['"])delivery_requests\1\)/);
    expect(linkServiceSource).not.toMatch(/delivery_requests\s*:/);
    expect(checkoutSource).not.toMatch(/\.from\((['"])delivery_requests\1\)/);
    expect(checkoutSource).not.toMatch(/delivery_requests\s*:/);
    expect(deliveryManagementSource).not.toMatch(/\.from\((['"])delivery_requests\1\)/);
    expect(deliveryManagementSource).not.toMatch(/delivery_requests\s*:/);
  });
});
