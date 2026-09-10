import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Mobility driver authority", () => {
  it("keeps driver verification and ride offers outside direct browser writes", () => {
    const authorityMigration = readProjectFile(
      "supabase/migrations/20260909154500_harden_mobility_driver_authority_g7.sql",
    );
    const creationMigration = readProjectFile(
      "supabase/migrations/20260910003000_domain_owned_profile_creation_g36.sql",
    );
    const contractMigration = readProjectFile(
      "supabase/migrations/20260910004500_retire_legacy_profile_creation_bridges_g36.sql",
    );
    const mobilityRpc = readProjectFile("supabase/functions/mobility-rpc/index.ts");
    const runtime = readProjectFile(
      "src/core/mobility/services/MobilityRuntimeService.ts",
    );
    const driverIdentity = readProjectFile(
      "src/core/mobility/hooks/useDriverProfileIdentity.ts",
    );
    const driverService = readProjectFile(
      "src/core/profiles/services/multi-profile/driverService.ts",
    );

    expect(authorityMigration).toContain(
      "REVOKE INSERT, UPDATE, DELETE ON TABLE public.driver_data FROM authenticated",
    );
    expect(authorityMigration).toContain("public.update_owned_driver_data");
    expect(authorityMigration).toContain("Unsupported driver_data field");
    expect(authorityMigration).toContain("is_verified = false");
    expect(authorityMigration).toContain("documents_verified = false");
    expect(authorityMigration).toContain("background_check_status = 'pending'");
    expect(authorityMigration).toContain(
      "REVOKE UPDATE ON TABLE public.ride_offers FROM authenticated",
    );
    expect(authorityMigration).toContain(
      'DROP POLICY IF EXISTS "Drivers can respond to their own pending offers"',
    );

    expect(creationMigration).toContain("public.mobility_rpc_create_driver_profile");
    expect(creationMigration).toContain("public.mobility_rpc_ensure_admin_driver_profile");
    expect(creationMigration).toContain("private.mobility_ensure_admin_driver_profile");
    expect(creationMigration).toContain("private.is_admin_from_roles(p_actor_user_id)");

    expect(mobilityRpc).toContain("sanitizeDriverRegistrationExtension");
    expect(mobilityRpc).toContain("documents_verified: false");
    expect(mobilityRpc).toContain('background_check_status: "pending"');
    expect(mobilityRpc).toContain("canDoDelivery === canDoRides");
    expect(mobilityRpc).toContain('"mobility_rpc_ensure_admin_driver_profile"');

    expect(driverIdentity).toContain("MobilityRpcService.ensureAdminDriverProfile");
    expect(driverIdentity).not.toContain("createAdminDriverProfile");
    expect(runtime).not.toContain('"ensure_admin_driver_data"');
    expect(driverService).toContain("'update_owned_driver_data'");

    expect(contractMigration).toContain(
      "DROP FUNCTION IF EXISTS public.ensure_admin_driver_data(uuid)",
    );
    expect(contractMigration).toContain(
      "DROP FUNCTION IF EXISTS public.profile_rpc_create_profile_with_extension",
    );
    expect(contractMigration).not.toContain("CASCADE");
  });
});
