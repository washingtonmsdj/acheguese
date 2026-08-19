import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260819090115_lock_down_qr_code_browser_writes.sql",
);

describe("QR code browser write boundary", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("revokes direct browser mutation privileges", () => {
    expect(sql).toMatch(
      /revoke\s+insert,\s*update,\s*delete,\s*truncate,\s*references,\s*trigger\s+on\s+table\s+public\.qr_codes\s+from\s+anon,\s*authenticated/i,
    );
  });

  it("keeps QR resolution read access intact", () => {
    expect(sql).not.toMatch(
      /revoke\s+[^;]*select[^;]*on\s+table\s+public\.qr_codes\s+from\s+(?:anon|authenticated)/i,
    );
    expect(sql).toContain("has_table_privilege('anon','public.qr_codes','SELECT')");
    expect(sql).toContain("has_table_privilege('authenticated','public.qr_codes','SELECT')");
  });

  it("preserves server-side QR authority and fails closed if the table gains data", () => {
    expect(sql).toContain("qr_codes is no longer empty; review broker migration before locking writes");
    expect(sql).toContain("has_table_privilege('service_role','public.qr_codes','INSERT')");
    expect(sql).toContain("has_table_privilege('service_role','public.qr_codes','UPDATE')");
    expect(sql).toContain("has_table_privilege('service_role','public.qr_codes','DELETE')");
  });
});
