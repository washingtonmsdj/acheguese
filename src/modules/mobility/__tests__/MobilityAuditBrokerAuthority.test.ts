import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Mobility ride audit authority", () => {
  it("keeps browser audit writes behind mobility-rpc", () => {
    const auditService = readProjectFile(
      "src/core/mobility/services/MobilityAuditService.ts",
    );
    const adminService = readProjectFile(
      "src/core/admin/services/AdminMotoboyOperationsService.ts",
    );
    const rpcService = readProjectFile(
      "src/core/mobility/services/MobilityRpcService.ts",
    );
    const broker = readProjectFile("supabase/functions/mobility-rpc/index.ts");

    expect(auditService).toContain("MobilityRpcService.logRideStateChange");
    expect(auditService).not.toContain('.from("ride_state_audit")');
    expect(adminService).not.toContain('.from("ride_state_audit")');

    expect(rpcService).toContain('"logRideStateChange"');
    expect(broker).toContain("logRideStateChange: true");
    expect(broker).toContain("handleLogRideStateChange");
    expect(broker).toContain("canAccessRideAsParticipantOrAdmin");
    expect(broker).toContain("ride.status !== toState");
    expect(broker).toContain('supabaseAdmin.from("ride_state_audit").insert');
  });
});
