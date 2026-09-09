import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Mobility driver authority", () => {
  it("keeps driver verification and ride offers outside direct browser writes", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260909154500_harden_mobility_driver_authority_g7.sql",
    );
    const profileRpc = readProjectFile("supabase/functions/profile-rpc/index.ts");
    const runtime = readProjectFile(
      "src/core/mobility/services/MobilityRuntimeService.ts",
    );
    const driverService = readProjectFile(
      "src/core/profiles/services/multi-profile/driverService.ts",
    );

    expect(migration).toContain(
      "REVOKE INSERT, UPDATE, DELETE ON TABLE public.driver_data FROM authenticated",
    );
    expect(migration).toContain("public.update_owned_driver_data");
    expect(migration).toContain("Unsupported driver_data field");
    expect(migration).toContain("is_verified = false");
    expect(migration).toContain("documents_verified = false");
    expect(migration).toContain("background_check_status = 'pending'");
    expect(migration).toContain("public.ensure_admin_driver_data");
    expect(migration).toContain(
      "REVOKE UPDATE ON TABLE public.ride_offers FROM authenticated",
    );
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Drivers can respond to their own pending offers"',
    );

    expect(profileRpc).toContain("sanitizeDriverExtensionData");
    expect(profileRpc).toContain("documents_verified: false");
    expect(profileRpc).toContain('background_check_status: "pending"');
    expect(profileRpc).toContain("canDoDelivery === canDoRides");

    expect(runtime).toContain('"update_owned_driver_data"');
    expect(runtime).toContain('"ensure_admin_driver_data"');
    expect(driverService).toContain("'update_owned_driver_data'");
  });
});
