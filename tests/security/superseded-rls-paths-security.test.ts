import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const MIGRATION = readFileSync(
  resolve(ROOT, "supabase/migrations/20260926104500_remove_superseded_rls_paths.sql"),
  "utf8",
);

describe("superseded RLS path retirement", () => {
  it("drops only the four audited legacy policies", () => {
    for (const expected of [
      'DROP POLICY "Authors manage own answers" ON public.question_answers;',
      "DROP POLICY delivery_occurrences_participants_select ON public.delivery_occurrences;",
      "DROP POLICY order_items_participants_select ON public.order_items;",
      "DROP POLICY order_timeline_events_participants_select ON public.order_timeline_events;",
    ]) {
      expect(MIGRATION).toContain(expected);
    }

    expect(MIGRATION.match(/DROP POLICY/g)).toHaveLength(4);
  });

  it("requires the canonical replacement paths before dropping legacy access", () => {
    expect(MIGRATION).toContain("question_answers_verified_insert");
    expect(MIGRATION).toContain("private.auth_has_verified_residence");
    expect(MIGRATION).toContain("question_answers_owner_or_admin_update");
    expect(MIGRATION).toContain("question_answers_owner_or_admin_delete");
    expect(MIGRATION.match(/private\.auth_can_access_profile/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("does not widen privileges or mutate application data", () => {
    expect(MIGRATION).not.toMatch(/CREATE\s+POLICY/i);
    expect(MIGRATION).not.toMatch(/ALTER\s+POLICY/i);
    expect(MIGRATION).not.toMatch(/GRANT\s+/i);
    expect(MIGRATION).not.toMatch(/REVOKE\s+/i);
    expect(MIGRATION).not.toMatch(/\b(INSERT|UPDATE|DELETE)\s+(INTO|public\.|private\.)/i);
    expect(MIGRATION).not.toMatch(/ALTER\s+TABLE/i);
  });

  it("fails closed on catalog drift and verifies the postcondition", () => {
    expect(MIGRATION).toContain("legacy policy drifted; review before dropping");
    expect(MIGRATION).toContain("canonical write policies are missing or drifted");
    expect(MIGRATION).toContain("canonical participant policies are missing or drifted");
    expect(MIGRATION).toContain("postcondition failed: superseded RLS path remains");
  });
});
