import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const FAIL_CLOSED_LEDGER_ENFORCEMENT_VERSION = "20260830101000";
const MIGRATION_NAME_PATTERN = /^(\d+)_.*\.sql$/;

function stripSqlComments(content: string): string {
  return content.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

function validateFutureFailClosedMigration(
  fileName: string,
  rawContent: string,
): string[] {
  const version = fileName.match(MIGRATION_NAME_PATTERN)?.[1];
  if (!version || version < FAIL_CLOSED_LEDGER_ENFORCEMENT_VERSION) return [];

  const content = stripSqlComments(rawContent);
  const violations: string[] = [];

  const destructiveDrop =
    /\bDROP\s+(?:TABLE|VIEW|MATERIALIZED\s+VIEW|FUNCTION|PROCEDURE|TYPE|SCHEMA)\b/gi;
  const destructiveIfExists =
    /\bDROP\s+(?:TABLE|VIEW|MATERIALIZED\s+VIEW|FUNCTION|PROCEDURE|TYPE|SCHEMA)\s+IF\s+EXISTS\b/i;
  const destructiveCascade =
    /\bDROP\s+(?:TABLE|VIEW|MATERIALIZED\s+VIEW|FUNCTION|PROCEDURE|TYPE|SCHEMA)\b[^;]*\bCASCADE\s*;/i;
  const swallowedException =
    /\bEXCEPTION\b[\s\S]{0,240}?\bWHEN\s+(?:OTHERS|undefined_table|undefined_function|undefined_object)\b[\s\S]{0,240}?\bTHEN\s+(?:NULL\s*;|RAISE\s+(?:NOTICE|WARNING)\b)/i;
  const directStorageBucketDelete =
    /\bDELETE\s+FROM\s+storage\s*\.\s*buckets\b/i;

  if (destructiveIfExists.test(content)) {
    violations.push(
      `${fileName}: destructive DROP IF EXISTS hides a missing ledger prerequisite`,
    );
  }
  if (destructiveCascade.test(content)) {
    violations.push(
      `${fileName}: destructive DROP CASCADE is forbidden; unexpected dependencies must fail closed`,
    );
  }
  if (swallowedException.test(content)) {
    violations.push(
      `${fileName}: migration swallows an unexpected prerequisite/dependency failure`,
    );
  }
  if (directStorageBucketDelete.test(content)) {
    violations.push(
      `${fileName}: storage buckets must be removed through the official Storage API, not SQL`,
    );
  }

  const destructiveStatements = Array.from(content.matchAll(destructiveDrop));
  if (destructiveStatements.length === 0) return violations;

  if (!/^\s*BEGIN\s*;/i.test(content) || !/\bCOMMIT\s*;\s*$/i.test(content)) {
    violations.push(
      `${fileName}: destructive migration must be wrapped in an explicit transaction`,
    );
  }

  const firstDropIndex = destructiveStatements[0].index ?? 0;
  const raiseExceptionIndexes = Array.from(
    content.matchAll(/\bRAISE\s+EXCEPTION\b/gi),
  ).map((match) => match.index ?? -1);

  const hasPrecondition = raiseExceptionIndexes.some(
    (index) => index >= 0 && index < firstDropIndex,
  );
  const hasPostcondition = raiseExceptionIndexes.some(
    (index) => index > firstDropIndex,
  );

  if (!hasPrecondition) {
    violations.push(
      `${fileName}: destructive migration must fail closed on an explicit precondition before DROP`,
    );
  }
  if (!hasPostcondition) {
    violations.push(
      `${fileName}: destructive migration must assert an explicit postcondition after DROP`,
    );
  }

  for (const match of content.matchAll(
    /\bDROP\s+(?:TABLE|VIEW|MATERIALIZED\s+VIEW)\b[^;]*;/gi,
  )) {
    if (!/\bRESTRICT\s*;/i.test(match[0])) {
      violations.push(
        `${fileName}: destructive table/view DROP must state RESTRICT explicitly`,
      );
    }
  }

  return violations;
}

describe("G5 migration fail-closed ratchet", () => {
  it("keeps every migration after the G5 cutover fail closed", () => {
    const violations = readdirSync(MIGRATIONS_DIR)
      .filter((fileName) => fileName.endsWith(".sql"))
      .flatMap((fileName) =>
        validateFutureFailClosedMigration(
          fileName,
          readFileSync(join(MIGRATIONS_DIR, fileName), "utf8"),
        ),
      );

    expect(violations).toEqual([]);
  });

  it("rejects destructive IF EXISTS and CASCADE after cutover", () => {
    const violations = validateFutureFailClosedMigration(
      "20260830101001_bad_drop.sql",
      "BEGIN; DROP TABLE IF EXISTS public.legacy CASCADE; COMMIT;",
    );

    expect(violations.join("\n")).toMatch(/DROP IF EXISTS/);
    expect(violations.join("\n")).toMatch(/DROP CASCADE/);
  });

  it("rejects catch-and-continue and direct Storage bucket deletion", () => {
    const violations = validateFutureFailClosedMigration(
      "20260830101002_bad_suppression.sql",
      `
        BEGIN;
        DO $$
        BEGIN
          DELETE FROM storage.buckets WHERE id = 'legacy';
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'ignored';
        END
        $$;
        COMMIT;
      `,
    );

    expect(violations.join("\n")).toMatch(/swallows/);
    expect(violations.join("\n")).toMatch(/Storage API/);
  });

  it("accepts the canonical preflight + RESTRICT + postcondition pattern", () => {
    const violations = validateFutureFailClosedMigration(
      "20260830101003_good_retirement.sql",
      `
        BEGIN;
        DO $$
        BEGIN
          IF to_regclass('public.legacy') IS NULL THEN
            RAISE EXCEPTION 'preflight: legacy missing';
          END IF;
        END
        $$;

        DROP TABLE public.legacy RESTRICT;

        DO $$
        BEGIN
          IF to_regclass('public.legacy') IS NOT NULL THEN
            RAISE EXCEPTION 'postcondition: legacy remains';
          END IF;
        END
        $$;
        COMMIT;
      `,
    );

    expect(violations).toEqual([]);
  });
});
