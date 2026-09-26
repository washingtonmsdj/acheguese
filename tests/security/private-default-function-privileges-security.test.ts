import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const repair = readFileSync(
  "supabase/migrations/20260926025000_repair_postgres_function_default_privileges.sql",
  "utf8",
);

describe("future private function privileges", () => {
  it("fails closed through the required global PUBLIC execute revoke", () => {
    expect(repair).toMatch(
      /ALTER DEFAULT PRIVILEGES FOR ROLE postgres\s+REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;/,
    );
    expect(repair).not.toMatch(
      /IN SCHEMA private\s+GRANT EXECUTE ON FUNCTIONS/i,
    );
  });

  it("preserves PUBLIC execute only for future extension functions", () => {
    expect(repair).toMatch(
      /ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA extensions\s+GRANT EXECUTE ON FUNCTIONS TO PUBLIC;/,
    );
  });

  it("changes default privileges only", () => {
    expect(repair.match(/ALTER DEFAULT PRIVILEGES/g)).toHaveLength(2);
    expect(repair).not.toMatch(/^\s*ALTER\s+FUNCTION\b/im);
    expect(repair).not.toMatch(/^\s*CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\b/im);
    expect(repair).not.toMatch(/^\s*(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM|TRUNCATE)\b/im);
  });
});
