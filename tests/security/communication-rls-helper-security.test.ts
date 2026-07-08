import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("communication RLS helper security", () => {
  it("moves the channel-management RLS helper out of the public RPC surface", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260707151447_move_communication_rls_helper_to_private_schema.sql",
    );

    expect(migration).toContain("CREATE SCHEMA IF NOT EXISTS private");
    expect(migration).toContain("REVOKE ALL ON SCHEMA private FROM PUBLIC");
    expect(migration).toContain("private.communication_current_user_can_manage_channel");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION private.communication_current_user_can_manage_channel(uuid)");
    expect(migration).toContain("TO authenticated, service_role");
    expect(migration).toContain("ALTER POLICY communication_distribution_member_select");
    expect(migration).toContain("ALTER POLICY communication_publications_member_select");
    expect(migration).toContain("ALTER POLICY communication_publications_member_insert");
    expect(migration).toContain("ALTER POLICY communication_publications_member_update");
    expect(migration).toContain("DROP FUNCTION public.communication_current_user_can_manage_channel(uuid)");
    expect(migration).not.toContain("GRANT EXECUTE ON FUNCTION public.communication_current_user_can_manage_channel");
  });
});
