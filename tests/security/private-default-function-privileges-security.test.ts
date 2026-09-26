import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260926024500_fail_closed_future_private_function_grants.sql",
  "utf8",
);

describe("future private function privileges", () => {
  it("makes future postgres-owned private functions fail closed", () => {
    expect(migration).toMatch(
      /ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA private\s+REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;/,
    );
  });

  it("changes default privileges only", () => {
    expect(migration.match(/ALTER DEFAULT PRIVILEGES/g)).toHaveLength(1);
    expect(migration).not.toMatch(/^\s*ALTER\s+FUNCTION\b/im);
    expect(migration).not.toMatch(/^\s*(?:GRANT|REVOKE)\s+.*\bON\s+FUNCTION\b/im);
    expect(migration).not.toMatch(/^\s*(?:GRANT|REVOKE)\s+.*\bON\s+SCHEMA\b/im);
    expect(migration).not.toMatch(/^\s*CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\b/im);
    expect(migration).not.toMatch(/^\s*(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM|TRUNCATE)\b/im);
  });
});
