import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const broker = read("src/core/profiles/services/ProfileRpcService.ts");
const migration = read(
  "supabase/migrations/20261005132500_revoke_authenticated_profile_direct_writes.sql",
).replace(/\s+/g, " ");

describe("Profile direct-write boundary", () => {
  it("keeps Profile lifecycle mutations behind the profile-rpc broker", () => {
    expect(broker).toContain('const FUNCTION_NAME = "profile-rpc"');
    expect(broker).toContain('"createPersonal"');
    expect(broker).toContain('"createBusiness"');
    expect(broker).toContain('"updateBusiness"');
    expect(broker).toContain('"updateOwnedProfile"');
    expect(broker).toContain('"deleteProfile"');
  });

  it("revokes direct authenticated Profile table writes without widening access", () => {
    expect(migration).toContain(
      "REVOKE INSERT, UPDATE ON TABLE public.profiles FROM authenticated;",
    );
    expect(migration).not.toMatch(/GRANT\s+(?:INSERT|UPDATE|DELETE|ALL)\s+ON\s+TABLE\s+public\.profiles\s+TO\s+authenticated/i);
  });
});
