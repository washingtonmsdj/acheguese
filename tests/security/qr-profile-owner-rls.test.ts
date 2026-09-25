import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const migration = readFileSync(
  join(
    ROOT,
    "supabase",
    "migrations",
    "20260916100135_fix_qr_profile_owner_rls.sql",
  ),
  "utf8",
);

const browserLock = readFileSync(
  join(
    ROOT,
    "supabase",
    "migrations",
    "20260819090115_lock_down_qr_code_browser_writes.sql",
  ),
  "utf8",
);

describe("QR profile ownership RLS", () => {
  it("authorizes QR ownership through the canonical profile authority", () => {
    expect(migration).toContain("private.can_manage_profile(owner_profile_id)");
    expect(migration).toContain("private.can_manage_profile(qc.owner_profile_id)");
    expect(migration).not.toMatch(/owner_profile_id\s*=\s*\(?\s*(?:select\s+)?auth\.uid\(\)/i);
  });

  it("guards both the old row and the replacement owner on updates", () => {
    expect(migration).toMatch(
      /FOR UPDATE[\s\S]*USING \(private\.can_manage_profile\(owner_profile_id\)\)[\s\S]*WITH CHECK \(private\.can_manage_profile\(owner_profile_id\)\)/,
    );
  });

  it("keeps direct browser QR mutations revoked", () => {
    for (const source of [browserLock, migration]) {
      expect(source).toMatch(
        /REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER[\s\S]*ON TABLE public\.qr_codes[\s\S]*FROM anon, authenticated;/,
      );
    }
  });
});
