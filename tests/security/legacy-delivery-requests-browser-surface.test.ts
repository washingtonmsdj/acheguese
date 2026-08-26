import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(import.meta.dirname, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

const lockMigration = readProjectFile(
  "supabase/migrations/20260826010000_lock_legacy_delivery_requests_browser_surface.sql",
);
const helperRpcMigration = readProjectFile(
  "supabase/migrations/20260826040200_restrict_legacy_delivery_helper_rpcs.sql",
);
const ssotGuard = readProjectFile(
  "src/modules/mobility/delivery/__tests__/DeliverySSOTGuard.test.ts",
);

describe("legacy delivery_requests browser boundary", () => {
  it("keeps the retained legacy table server-only", () => {
    expect(lockMigration).toContain(
      "REVOKE ALL PRIVILEGES ON TABLE public.delivery_requests",
    );
    expect(lockMigration).toContain("FROM PUBLIC, anon, authenticated");
    expect(lockMigration).toContain(
      "GRANT ALL PRIVILEGES ON TABLE public.delivery_requests TO service_role",
    );

    for (const policy of [
      "delivery_requests_business_insert",
      "delivery_requests_business_select",
      "delivery_requests_business_update",
      "delivery_requests_driver_accept",
      "delivery_requests_driver_select",
      "delivery_requests_driver_update",
    ]) {
      expect(lockMigration).toContain(`DROP POLICY IF EXISTS ${policy}`);
    }
  });

  it("keeps legacy delivery helper RPCs server-only", () => {
    for (const signature of [
      "public.get_available_deliveries(NUMERIC, NUMERIC, NUMERIC)",
      "public.get_delivery_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ)",
      "public.get_next_delivery_request_number(UUID)",
      "public.log_delivery_status_change()",
    ]) {
      expect(helperRpcMigration).toContain(`REVOKE ALL ON FUNCTION ${signature}`);
      expect(helperRpcMigration).toContain(`GRANT EXECUTE ON FUNCTION ${signature}`);
    }

    expect(helperRpcMigration).toContain("FROM PUBLIC, anon, authenticated");
    expect(helperRpcMigration).toContain("TO service_role");
    expect(helperRpcMigration).toContain("has_function_privilege('anon'");
    expect(helperRpcMigration).toContain("has_function_privilege('authenticated'");
  });

  it("keeps platform motoboy runtime off the legacy table", () => {
    expect(ssotGuard).toContain("ride_requests");
    expect(ssotGuard).toContain("delivery_requests");
    expect(ssotGuard).toContain("not.toMatch");
  });
});
