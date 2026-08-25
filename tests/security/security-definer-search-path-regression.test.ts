import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const BASELINE = "20260825184600_harden_driver_profiles_financial_read.sql";

function migrationsFromBaseline() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql") && name >= BASELINE)
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS_DIR, name), "utf8"),
    }));
}

function functionHeaders(sql: string): string[] {
  const normalized = sql.replace(/--[^\n]*/g, " ");
  const headers: string[] = [];
  const pattern = /create\s+(?:or\s+replace\s+)?function\s+[\s\S]*?\bas\s+\$[A-Za-z0-9_]*\$/gi;

  for (const match of normalized.matchAll(pattern)) {
    headers.push(match[0]);
  }

  return headers;
}

function functionName(header: string): string | null {
  return header.match(/\bfunction\s+([^\s(]+)\s*\(/i)?.[1] ?? null;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("SECURITY DEFINER regression guard", () => {
  it("keeps every newly declared SECURITY DEFINER function on an explicit search_path", () => {
    const regressions: string[] = [];

    for (const { name, sql } of migrationsFromBaseline()) {
      for (const header of functionHeaders(sql)) {
        if (!/\bsecurity\s+definer\b/i.test(header)) continue;

        if (!/\bset\s+search_path\s*(?:=|to)\s*/i.test(header)) {
          const fn = header.match(/\bfunction\s+([^\s(]+\s*\([^)]*\))/i)?.[1] ?? "unknown function";
          regressions.push(`${name}: ${fn}`);
        }
      }
    }

    expect(
      regressions,
      "new SECURITY DEFINER functions must pin search_path explicitly",
    ).toEqual([]);
  });

  it("revokes PostgreSQL's default PUBLIC execute privilege for every new SECURITY DEFINER", () => {
    const regressions: string[] = [];

    for (const { name, sql } of migrationsFromBaseline()) {
      const normalized = sql.replace(/--[^\n]*/g, " ").replace(/\s+/g, " ");

      for (const header of functionHeaders(sql)) {
        if (!/\bsecurity\s+definer\b/i.test(header)) continue;

        const fn = functionName(header);
        if (!fn) {
          regressions.push(`${name}: unable to resolve function name`);
          continue;
        }

        const revokePublic = new RegExp(
          `\\brevoke\\s+(?:all(?:\\s+privileges)?|execute)\\s+on\\s+function\\s+${escapeRegex(fn)}\\s*\\([^;]*?\\)\\s+from\\s+public\\b`,
          "i",
        );

        if (!revokePublic.test(normalized)) {
          regressions.push(`${name}: ${fn}`);
        }
      }
    }

    expect(
      regressions,
      "new SECURITY DEFINER functions must revoke default PUBLIC execution before explicit role grants",
    ).toEqual([]);
  });
});
