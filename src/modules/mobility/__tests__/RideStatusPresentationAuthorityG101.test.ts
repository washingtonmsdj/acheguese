import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G101 canonical ride status presentation", () => {
  const statusBadge = readProjectFile(
    "src/modules/mobility/components/StatusBadge.tsx",
  );
  const rideCardHeader = readProjectFile(
    "src/modules/mobility/components/passenger/ride-card/RideCardHeader.tsx",
  );
  const adminDashboard = readProjectFile(
    "src/modules/admin/pages/AdminRealtimeDashboard.tsx",
  );

  it("accepts raw read-boundary statuses without coercing them to pending", () => {
    expect(statusBadge).toContain("status: string");
    expect(rideCardHeader).toContain("<StatusBadge status={status}");
    expect(rideCardHeader).not.toContain("rideCardStatuses");
    expect(rideCardHeader).not.toContain("toRideStatus");
    expect(rideCardHeader).not.toContain('return "pending"');
  });

  it("uses the canonical mobility badge in the admin realtime dashboard", () => {
    expect(adminDashboard).toContain(
      'import { StatusBadge } from "@/modules/mobility/components/StatusBadge"',
    );
    expect(adminDashboard).toContain('<StatusBadge status={ride.status} size="sm" />');
    expect(adminDashboard).not.toContain("const getStatusColor");
    expect(adminDashboard).not.toContain("const getStatusText");
  });
});
