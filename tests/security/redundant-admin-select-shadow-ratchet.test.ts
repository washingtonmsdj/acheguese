import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const CUTOVER_VERSION = "20260831033547";
const MIGRATION_NAME_PATTERN = /^(\d+)_.*\.sql$/;

const REMOVED_ADMIN_SELECT_SHADOWS = [
  "Admins can view all locations",
  "Admins can view all ride requests",
  "Admins can view all orders",
  "Admins can view all classifieds",
  "Admins can view all events",
  "Admins can view all community posts",
  "Admins can view all professional jobs",
] as const;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateFutureMigration(fileName: string, sql: string): string[] {
  const version = fileName.match(MIGRATION_NAME_PATTERN)?.[1];
  if (!version || version < CUTOVER_VERSION) return [];

  const violations: string[] = [];
  for (const policyName of REMOVED_ADMIN_SELECT_SHADOWS) {
    const recreate = new RegExp(
      `\\bCREATE\\s+POLICY\\s+["']?${escapeRegex(policyName)}["']?`,
      "i",
    );
    if (recreate.test(sql)) {
      violations.push(
        `${fileName}: ${policyName} is a redundant SELECT shadow of its canonical admin ALL policy`,
      );
    }
  }
  return violations;
}

describe("G5 redundant admin SELECT shadow ratchet", () => {
  it("does not recreate retired admin SELECT shadows", () => {
    const violations = readdirSync(MIGRATIONS_DIR)
      .filter((fileName) => fileName.endsWith(".sql"))
      .flatMap((fileName) =>
        validateFutureMigration(
          fileName,
          readFileSync(join(MIGRATIONS_DIR, fileName), "utf8"),
        ),
      );

    expect(violations).toEqual([]);
  });

  it("rejects a future recreation", () => {
    const violations = validateFutureMigration(
      "20260831033548_bad_shadow.sql",
      `CREATE POLICY "Admins can view all orders"
       ON public.orders FOR SELECT TO authenticated
       USING (private.is_admin((SELECT auth.uid())));`,
    );

    expect(violations.join("\n")).toMatch(/redundant SELECT shadow/);
  });
});
