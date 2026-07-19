import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("admin user account listing", () => {
  const migration = readProjectFile(
    "supabase/migrations/20260719010000_list_admin_user_accounts.sql",
  );
  const broker = readProjectFile(
    "supabase/functions/admin-list-users/index.ts",
  );

  it("paginates distinct account ids behind the service-role boundary", () => {
    expect(migration).toContain("FROM auth.users AS account");
    expect(migration).toContain("SET search_path = ''");
    expect(migration).toContain("auth.role() IS DISTINCT FROM 'service_role'");
    expect(migration).toMatch(
      /REVOKE ALL ON FUNCTION public\.admin_list_user_account_contexts[\s\S]+FROM PUBLIC, anon, authenticated/,
    );
    expect(migration).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.admin_list_user_account_contexts[\s\S]+TO service_role/,
    );
  });

  it("keeps Auth PII in the broker and does not log the search term", () => {
    expect(broker).toContain('"admin_list_user_account_contexts"');
    expect(broker).not.toContain("profilesPageQuery");
    expect(broker).not.toMatch(/\.from\(["']profiles["']\)/);
    expect(broker).not.toMatch(/\.from\(["']user_roles["']\)/);
    expect(broker).toContain("const UUID_REGEX");
    expect(broker).not.toContain("UUID_V4ISH_REGEX");
    expect(broker).not.toContain("details: { page, pageSize, search,");
    expect(broker).toContain("searchApplied: normalizedSearch !== null");
  });
});
