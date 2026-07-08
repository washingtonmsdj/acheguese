import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("public snapshot RPC security", () => {
  it("keeps public business and gastronomy snapshots invoker-scoped", () => {
    const migration = readProjectFile(
      "supabase/migrations/20260707124348_harden_public_snapshot_rpcs_invoker.sql",
    );

    expect(migration).toContain(
      "-- security-authority: public-rpc public.get_public_business_snapshot_by_slug",
    );
    expect(migration).toContain(
      "ALTER FUNCTION public.get_public_business_snapshot_by_slug(text, text, text, text)",
    );
    expect(migration).toContain("SECURITY INVOKER");
    expect(migration).toContain("SET search_path = public, pg_temp");
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.get_public_business_snapshot_by_slug(text, text, text, text)",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.get_public_business_snapshot_by_slug(text, text, text, text)",
    );

    expect(migration).toContain(
      "-- security-authority: public-rpc public.get_public_gastronomy_snapshot_by_slug",
    );
    expect(migration).toContain(
      "ALTER FUNCTION public.get_public_gastronomy_snapshot_by_slug(text, text, text, text)",
    );
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION public.get_public_gastronomy_snapshot_by_slug(text, text, text, text)",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.get_public_gastronomy_snapshot_by_slug(text, text, text, text)",
    );
    expect(migration).toContain("TO anon, authenticated");
    expect(migration).not.toContain("SECURITY DEFINER");
  });
});
