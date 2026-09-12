import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G149 admin motoboy count ownership", () => {
  const adminReader = readProjectFile(
    "src/core/admin/services/AdminMotoboyReadService.ts",
  );
  const adminService = readProjectFile(
    "src/core/admin/services/AdminService.ts",
  );
  const mobilityImpl = readProjectFile(
    "src/core/mobility/services/MobilityService.impl.ts",
  );

  it("owns delivered counts in the admin motoboy reader", () => {
    expect(adminReader).toContain("static async countDeliveredBySource(");
    expect(adminReader).toContain("static async countDeliveredTotal(");
    expect(adminReader).toContain('{ count: "exact", head: true }');
    expect(adminReader).toContain('.eq("ride_mode", "motoboy")');
    expect(adminReader).toContain('.eq("status", "delivered")');
  });

  it("routes admin platform/business metrics through the admin owner", () => {
    expect(adminService).toContain(
      "AdminMotoboyReadService.countDeliveredBySource('business', business.id)",
    );
    expect(adminService).toContain("AdminMotoboyReadService.countDeliveredTotal()");
    expect(adminService).not.toContain("MobilityService.countDeliveredBySource");
    expect(adminService).not.toContain("MobilityService.countDeliveredMotoboyRides");
  });

  it("retires delivered-count compatibility wrappers", () => {
    expect(mobilityImpl).not.toContain("static async countDeliveredBySource(");
    expect(mobilityImpl).not.toContain("static async countDeliveredMotoboyRides(");
  });
});
