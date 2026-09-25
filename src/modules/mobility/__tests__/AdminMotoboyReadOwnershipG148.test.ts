import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G148 admin motoboy read ownership", () => {
  const adminReader = readProjectFile(
    "src/core/admin/services/AdminMotoboyReadService.ts",
  );
  const operations = readProjectFile(
    "src/core/admin/services/AdminMotoboyOperationsService.ts",
  );

  it("routes admin motoboy lists through the dedicated admin reader", () => {
    expect(operations).toContain("AdminMotoboyReadService.listDeliveries(filters)");
    expect(operations).toContain("AdminMotoboyReadService.listStatsRows()");
    expect(operations).not.toContain("MobilityService.listMotoboyDeliveries");
    expect(operations).not.toContain("MobilityService.listMotoboyStatsRows");
  });

  it("keeps the admin delivery projection explicit and bounded", () => {
    expect(adminReader).toContain('from("ride_requests")');
    expect(adminReader).toContain('.eq("ride_mode", "motoboy")');
    expect(adminReader).not.toContain('select("*")');
    expect(adminReader).not.toContain("recipient_phone");
    expect(adminReader).not.toContain("proof_of_delivery");
    expect(adminReader).not.toContain("failed_delivery_metadata");
    expect(adminReader).not.toContain("origin_lat");
    expect(adminReader).not.toContain("destination_lat");
  });

  it("keeps stats rows narrower than the operational list", () => {
    const statsStart = adminReader.indexOf("static async listStatsRows(");
    const statsMethod = adminReader.slice(statsStart);
    expect(statsMethod).toContain('.select("status, created_at, driver_profile_id")');
  });

  it("retires the generic compatibility wrappers", () => {
    expect(existsSync(resolve(process.cwd(), "src/core/mobility/services/MobilityService.impl.ts"))).toBe(false);
  });
});
