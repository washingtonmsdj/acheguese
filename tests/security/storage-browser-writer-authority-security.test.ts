import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS = join(ROOT, "supabase", "migrations");
const LOCKDOWN = "20260830100944_lock_ai_images_and_dormant_documents_storage_g5.sql";

function migrationsAfterLockdown() {
  return readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith(".sql") && name > LOCKDOWN)
    .sort()
    .map((name) => ({ name, sql: readFileSync(join(MIGRATIONS, name), "utf8") }));
}

describe("G5 Storage browser writer authority", () => {
  it("keeps ai-images server-generated and documents fail-closed", () => {
    const sql = readFileSync(join(MIGRATIONS, LOCKDOWN), "utf8");

    expect(sql).toMatch(/drop\s+policy\s+if\s+exists\s+"ai-images owner insert"/i);
    expect(sql).toMatch(/drop\s+policy\s+if\s+exists\s+"ai-images owner update"/i);
    expect(sql).toMatch(/drop\s+policy\s+if\s+exists\s+"ai-images owner delete"/i);
    expect(sql).toMatch(/drop\s+policy\s+if\s+exists\s+"Users can view their own documents"/i);
    expect(sql).toMatch(/drop\s+policy\s+if\s+exists\s+"Users can upload their own documents"/i);
    expect(sql).toMatch(/drop\s+policy\s+if\s+exists\s+"Users can delete their own documents"/i);
  });

  it("rejects future browser writers for ai-images or any browser policy for documents", () => {
    const offenders: string[] = [];

    for (const { name, sql } of migrationsAfterLockdown()) {
      if (!/create\s+policy\b/i.test(sql)) continue;

      if (
        /ai-images/i.test(sql) &&
        /\bfor\s+(?:insert|update|delete|all)\b/i.test(sql) &&
        /\bto\s+(?:public|anon|authenticated)\b/i.test(sql)
      ) {
        offenders.push(`${name}: ai-images browser writer`);
      }

      if (
        /documents/i.test(sql) &&
        /\bto\s+(?:public|anon|authenticated)\b/i.test(sql)
      ) {
        offenders.push(`${name}: documents browser policy`);
      }
    }

    expect(
      offenders,
      "Storage authority expansion requires a new owner/SSOT decision",
    ).toEqual([]);
  });
});
