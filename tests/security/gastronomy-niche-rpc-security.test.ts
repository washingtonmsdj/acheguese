import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("gastronomy niche RPC security", () => {
  it("keeps capability/versioning mutations behind trusted server paths", () => {
    const service = readProjectFile(
      "src/modules/business/gastronomy/niches/versioning/NicheVersioningService.ts",
    );
    const migration = readProjectFile(
      "supabase/migrations/20260707153515_harden_gastronomy_niche_capability_rpcs.sql",
    );
    const columnGrantMigration = readProjectFile(
      "supabase/migrations/20260707155447_harden_gastronomy_profile_column_grants.sql",
    );

    expect(service).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']has_niche_capability/);
    expect(service).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']add_niche_capability/);
    expect(service).not.toMatch(/rpc(?:<[^>]+>)?\(\s*["']mark_niche_needs_upgrade/);
    expect(service).toContain(".from('gastronomy_profiles')");
    expect(service).toContain("TRUSTED_SERVER_ONLY_ERROR");

    expect(migration).toContain("ALTER FUNCTION public.has_niche_capability(uuid, text)");
    expect(migration).toContain("SECURITY INVOKER");
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.has_niche_capability(uuid, text) FROM PUBLIC, anon, authenticated",
    );
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.add_niche_capability(uuid, text, uuid) FROM PUBLIC, anon, authenticated",
    );
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.mark_niche_needs_upgrade(text, text[]) FROM PUBLIC, anon, authenticated",
    );
    expect(migration).toContain("TO service_role");
    expect(migration).toContain(
      "REVOKE ALL ON TABLE public.gastronomy_niche_upgrade_history FROM authenticated",
    );

    expect(columnGrantMigration).toContain(
      "REVOKE INSERT, UPDATE, DELETE ON TABLE public.gastronomy_profiles FROM authenticated",
    );
    expect(columnGrantMigration).toContain("GRANT UPDATE (");
    expect(columnGrantMigration).toContain("cuisine_type");
    expect(columnGrantMigration).toContain("delivery_enabled");
    expect(columnGrantMigration).not.toMatch(/GRANT UPDATE \([\s\S]*enabled_capabilities/);
    expect(columnGrantMigration).not.toMatch(/GRANT UPDATE \([\s\S]*plan_tier/);
    expect(columnGrantMigration).not.toMatch(/GRANT INSERT \([\s\S]*enabled_capabilities/);
    expect(columnGrantMigration).not.toMatch(/GRANT INSERT \([\s\S]*plan_tier/);
  });
});
