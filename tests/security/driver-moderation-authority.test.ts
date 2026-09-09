import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

describe("Driver moderation authority", () => {
  const migration = readProjectFile(
    "supabase/migrations/20260909204327_lock_driver_moderation_history_g28.sql",
  );
  const service = readProjectFile(
    "src/core/mobility/services/DriverModerationEventsService.ts",
  );
  const adminRuntime = readProjectFile(
    "src/core/admin/services/AdminMobilityRuntimeService.ts",
  );
  const adminHook = readProjectFile(
    "src/core/admin/drivers/hooks/useDriverManagement.ts",
  );

  it("keeps driver moderation history append-only for browser roles", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION public.append_driver_moderation_event",
    );
    expect(migration).toContain(
      "REVOKE INSERT, UPDATE, DELETE",
    );
    expect(migration).toContain(
      "ON TABLE public.driver_moderation_events",
    );
    expect(migration).toContain(
      'DROP POLICY IF EXISTS "Admins can manage driver moderation events"',
    );
    expect(migration).toContain(
      'CREATE POLICY "Admins can view driver moderation events"',
    );
  });

  it("derives the moderator identity and event timestamp server-side", () => {
    expect(migration).toContain(
      "private.is_admin_from_roles(auth.uid())",
    );
    expect(migration).toContain(
      "profile.user_id = auth.uid()",
    );
    expect(migration).toContain(
      "v_admin_profile_id",
    );
    expect(migration).toContain(
      "pg_catalog.clock_timestamp()",
    );
    expect(service).not.toContain("admin_profile_id:");
    expect(service).not.toContain("adminProfileId");
    expect(adminRuntime).not.toContain("adminProfileId");
    expect(adminHook).not.toContain("adminProfileId");
  });

  it("routes runtime appends through the canonical command", () => {
    expect(service).toContain('"append_driver_moderation_event"');
    expect(service).toContain("driverModerationRpc.rpc");
    expect(service).not.toMatch(
      /from\(["']driver_moderation_events["']\)[\s\S]{0,180}\.insert\(/,
    );
  });

  it("preserves driver and admin read access while closing history mutation", () => {
    expect(migration).toContain(
      "FOR SELECT",
    );
    expect(migration).toContain(
      "TO authenticated",
    );
    expect(migration).not.toContain(
      'CREATE POLICY "Admins can manage driver moderation events"\n',
    );
  });
});
