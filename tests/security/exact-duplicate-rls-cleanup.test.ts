import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260926022500_remove_exact_duplicate_rls_policies.sql",
  "utf8",
);

describe("exact duplicate RLS cleanup", () => {
  it("drops only the three reviewed redundant policies", () => {
    expect(migration).toContain(
      'DROP POLICY "View profile links" ON public.profile_links;',
    );
    expect(migration).toContain(
      'DROP POLICY "Owners view own work opportunities" ON public.work_opportunities;',
    );
    expect(migration).toContain(
      'DROP POLICY "Users manage own answer likes" ON public.question_answer_likes;',
    );

    expect(migration.match(/^DROP POLICY\s+/gm) ?? []).toHaveLength(3);
  });

  it("preserves the canonical owner/read policies", () => {
    expect(migration).toContain("policyname='Manage profile links'");
    expect(migration).toContain(
      "policyname='Owners manage own work opportunities'",
    );
    expect(migration).toContain("policyname='question_answer_likes_own_read'");
  });

  it("keeps question-answer likes fail-closed for direct browser writes", () => {
    expect(migration).toContain(
      "has_table_privilege('authenticated','public.question_answer_likes','INSERT')",
    );
    expect(migration).toContain(
      "has_table_privilege('authenticated','public.question_answer_likes','UPDATE')",
    );
    expect(migration).toContain(
      "has_table_privilege('authenticated','public.question_answer_likes','DELETE')",
    );
  });

  it("does not change grants, table security, functions, or data", () => {
    expect(migration).not.toMatch(/^\s*(?:GRANT|REVOKE)\s+/im);
    expect(migration).not.toMatch(/^\s*CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\b/im);
    expect(migration).not.toMatch(/^\s*DROP\s+FUNCTION\b/im);
    expect(migration).not.toMatch(
      /^\s*ALTER\s+TABLE\b.*\b(?:ENABLE|DISABLE|FORCE|NO FORCE)\s+ROW\s+LEVEL\s+SECURITY\b/im,
    );
    expect(migration).not.toMatch(/^\s*(?:INSERT|UPDATE|DELETE|TRUNCATE)\b/im);
  });
});
