import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G115 admin fraud ride read model", () => {
  const service = readProjectFile(
    "src/core/admin/services/AdminFraudService.ts",
  );
  const panel = readProjectFile(
    "src/modules/admin/components/FraudDetectionPanel.tsx",
  );

  it("reads only the fraud alert fields required by the panel", () => {
    expect(service).toContain(
      '"id, ride_id, driver_profile_id, status, severity, fraud_type, description, evidence, created_at"',
    );
    expect(service).not.toContain('.from<FraudAlertReadRow>("fraud_alerts")\n        .select("*")');
  });

  it("loads ride summaries by explicit alert ride ids", () => {
    expect(service).toContain("static async getRideSummaries(");
    expect(service).toContain('.select("id, origin, destination")');
    expect(service).toContain('.in("id", uniqueRideIds)');
    expect(panel).toContain("AdminFraudService.getRideSummaries(rideIds)");
  });

  it("does not query rides using a driver profile id as a user id", () => {
    expect(panel).not.toContain("adminMobilityService.getUserRides");
    expect(panel).not.toContain("driverProfileIds[0]");
  });

  it("uses fraud alert status authority for the review action", () => {
    expect(panel).toContain("alert.status === ALERT_STATUS.PENDING");
    expect(panel).not.toContain("alert.status === RIDE_STATUS.PENDING");
  });
});
