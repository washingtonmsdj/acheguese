import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260819083952_allow_system_function_audit_events.sql",
);

describe("function_audit system-event provenance", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("keeps the production migration versioned with a fail-closed preflight", () => {
    expect(sql).toContain("function_audit.user_id not found");
    expect(sql).toContain("expected function_audit user_id FK contract not found");
    expect(sql).toMatch(/FOREIGN KEY \(user_id\) REFERENCES auth\.users\(id\) ON DELETE CASCADE/i);
  });

  it("allows system audit events by making user_id nullable", () => {
    expect(sql).toMatch(/ALTER TABLE public\.function_audit\s+ALTER COLUMN user_id DROP NOT NULL/i);
    expect(sql).toContain("NULL representa evento de sistema/service/cron sem usuário final.");
  });

  it("asserts the nullable contract and preserves the auth.users FK", () => {
    expect(sql).toContain("function_audit.user_id is still NOT NULL");
    expect(sql).toContain("function_audit user_id FK changed unexpectedly");
    expect(sql.match(/v_fk_count <> 1/g)?.length).toBe(2);
  });
});
