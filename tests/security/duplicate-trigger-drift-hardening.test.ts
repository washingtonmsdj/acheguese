import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260926021500_remove_duplicate_trigger_drift.sql",
  "utf8",
);

const canonicalQaMigration = readFileSync(
  "supabase/migrations/20260421120000_reconcile_community_qa_schema.sql",
  "utf8",
);

const canonicalDriverMigration = readFileSync(
  "supabase/migrations/20260412000000_create_core_identity_business_foundation.sql",
  "utf8",
);

describe("duplicate trigger drift cleanup", () => {
  it("removes only the three live-only duplicate trigger names", () => {
    expect(migration).toContain(
      "DROP TRIGGER set_driver_data_updated_at ON public.driver_data;",
    );
    expect(migration).toContain(
      "DROP TRIGGER trigger_sync_question_answer_likes_count ON public.question_answer_likes;",
    );
    expect(migration).toContain(
      "DROP TRIGGER trigger_sync_question_answers_count ON public.question_answers;",
    );

    const dropTriggers = migration.match(/^DROP TRIGGER\s+/gm) ?? [];
    expect(dropTriggers).toHaveLength(3);
  });

  it("preserves the versioned canonical triggers and their functions", () => {
    expect(canonicalDriverMigration).toContain(
      "CREATE TRIGGER update_driver_data_updated_at",
    );
    expect(canonicalQaMigration).toContain(
      "CREATE TRIGGER trg_sync_question_answer_likes_count",
    );
    expect(canonicalQaMigration).toContain(
      "CREATE TRIGGER trg_sync_question_answers_count",
    );

    expect(migration).not.toMatch(
      /^DROP TRIGGER\s+update_driver_data_updated_at\b/im,
    );
    expect(migration).not.toMatch(
      /^DROP TRIGGER\s+trg_sync_question_answer_likes_count\b/im,
    );
    expect(migration).not.toMatch(
      /^DROP TRIGGER\s+trg_sync_question_answers_count\b/im,
    );
    expect(migration).not.toMatch(/^DROP FUNCTION\b/im);
    expect(migration).not.toMatch(/^CREATE(?: OR REPLACE)? FUNCTION\b/im);
  });

  it("does not alter authorization or table security", () => {
    expect(migration).not.toMatch(/^\s*(?:GRANT|REVOKE)\s+/im);
    expect(migration).not.toMatch(
      /^\s*ALTER\s+TABLE\b.*\b(?:ENABLE|DISABLE|FORCE|NO FORCE)\s+ROW\s+LEVEL\s+SECURITY\b/im,
    );
    expect(migration).not.toMatch(/^\s*(?:INSERT|UPDATE|DELETE|TRUNCATE)\b/im);
  });
});
