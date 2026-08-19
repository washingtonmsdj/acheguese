import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260819085526_server_generate_ride_share_tokens.sql",
);

describe("ride share bearer token authority", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("always generates the public bearer token server-side", () => {
    expect(sql).toContain("NEW.share_token := pg_catalog.encode(extensions.gen_random_bytes(16), 'hex')");
    expect(sql).toMatch(
      /create\s+trigger\s+trg_assign_ride_share_token\s+before\s+insert\s+on\s+public\.ride_shares/i,
    );
    expect(sql).toMatch(/check\s*\(share_token\s*~\s*'\^\[0-9a-f\]\{32\}\$'\)/i);
  });

  it("does not expose the token generator directly to browser roles", () => {
    expect(sql).toMatch(
      /revoke\s+all\s+on\s+function\s+private\.assign_ride_share_token\(\)\s+from\s+public,\s*anon,\s*authenticated/i,
    );
    expect(sql).toMatch(
      /grant\s+execute\s+on\s+function\s+private\.assign_ride_share_token\(\)\s+to\s+service_role/i,
    );
  });

  it("validates token, status, and expiration integrity contracts", () => {
    expect(sql).toContain("VALIDATE CONSTRAINT ride_shares_status_check");
    expect(sql).toContain("VALIDATE CONSTRAINT ride_shares_expiration_contract");
    expect(sql).toContain("VALIDATE CONSTRAINT ride_shares_token_contract");
  });
});
