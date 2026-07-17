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
    const notificationMigrationSource = readProjectFile(
      "supabase/migrations/20260714115000_migrate_mobility_admin_notifications.sql",
    );

    expect(ssotServiceSource).not.toContain("OrderDeliveryNotificationService");
    expect(ssotServiceSource).not.toContain("notifyBestEffort");
    expect(notificationMigrationSource).toContain(
      "private.enqueue_order_notifications",
    );
    expect(notificationMigrationSource).toContain(
      "AFTER INSERT ON public.orders",
    );
    expect(notificationMigrationSource).toContain(
      "AFTER UPDATE OF logistics_status, proof_of_delivery ON public.orders",
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
