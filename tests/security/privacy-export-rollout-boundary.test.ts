import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const rollout = read("src/core/privacy/config/privacyRollout.ts");
const settingsService = read("src/core/privacy/services/PrivacySettingsService.ts");
const privacyService = read("src/core/privacy/services/PrivacyService.ts");
const privacyPage = read("src/app/pages/PrivacySettingsPage.tsx");
const exportFunction = read("supabase/functions/user-export-data/index.ts");
const productionEnv = read(".env.production");
const exportMatrix = JSON.parse(
  read("docs/09-reference/governance/privacy/LGPD_EXPORT_MATRIX.json"),
) as {
  sections: Array<{
    section: string;
    sources: string[];
    scope: string;
    include?: string[];
    exclude?: string[];
    notes?: string;
  }>;
};

const section = (name: string) =>
  exportMatrix.sections.find((candidate) => candidate.section === name);

describe("privacy data export rollout boundary", () => {
  it("keeps the uncertified export fail closed in source and production defaults", () => {
    expect(exportFunction).toContain(
      "const LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE = false;",
    );
    expect(rollout).toContain(
      "export const PRIVACY_DATA_EXPORT_RELEASE_CERTIFIED = false;",
    );
    expect(rollout).toContain(
      'import.meta.env.VITE_FEATURE_PRIVACY_DATA_EXPORT === "true"',
    );
    expect(productionEnv).toMatch(/^VITE_FEATURE_PRIVACY_DATA_EXPORT=false$/m);
  });

  it("classifies DPO case data but keeps the public-capable ledger and history out of self-service export", () => {
    const dpoSection = section("dpo_requests");

    expect(dpoSection).toBeDefined();
    expect(dpoSection?.sources).toEqual([
      "public.privacy_subject_requests",
      "public.privacy_subject_request_events",
    ]);
    expect(dpoSection?.scope).toBe("excluded");
    expect(dpoSection?.include ?? []).toEqual([]);
    expect(dpoSection?.exclude).toEqual(["all"]);
    expect(dpoSection?.notes).toContain("validated user_id");
    expect(dpoSection?.notes).toContain("user_id=NULL");
    expect(dpoSection?.notes).toContain("never be correlated by requester_email");
    expect(dpoSection?.notes).toContain("Lifecycle events");

    expect(exportFunction).not.toContain('.from("privacy_subject_requests")');
    expect(exportFunction).not.toContain('.from("privacy_subject_request_events")');
    expect(exportFunction).not.toContain("requester_email");
  });

  it("classifies confirmed subject-data sources discovered during completeness audit", () => {
    expect(section("profile_identity_history")?.sources).toEqual([
      "public.profile_username_history",
      "public.profile_slug_history",
    ]);
    expect(section("profile_identity_history")?.exclude).toEqual([
      "changed_by",
      "reason",
    ]);

    expect(section("business_claim_requests")?.sources).toEqual([
      "public.business_claims",
    ]);
    expect(section("business_claim_requests")?.scope).toBe(
      "rows-where-claimer_id-is-subject",
    );
    expect(section("business_claim_requests")?.exclude).toEqual([
      "claimer_id",
      "documents",
      "reviewed_by",
      "review_notes",
    ]);

    expect(section("role_history")?.sources).toEqual(["public.role_history"]);
    expect(section("role_history")?.include).toEqual([
      "role",
      "action",
      "performed_at",
    ]);
    expect(section("role_history")?.exclude).toEqual([
      "user_id",
      "performed_by",
      "reason",
      "metadata",
    ]);

    expect(section("business_recommendations")?.sources).toEqual([
      "public.user_recommended_businesses",
    ]);
    expect(section("business_recommendations")?.scope).toBe(
      "rows-where-user_id-is-subject",
    );
    expect(section("business_recommendations")?.exclude).toEqual([
      "user_id",
      "metadata",
    ]);

    const authoredSources = section("authored_content")?.sources ?? [];
    expect(authoredSources).toEqual(
      expect.arrayContaining([
        "public.classified_comments",
        "public.event_reviews",
      ]),
    );
    expect(section("authored_content")?.exclude).toContain(
      "event_reviews.reviewer_profile_id",
    );

    const actionSources = section("community_membership_and_actions")?.sources ?? [];
    expect(actionSources).toEqual(
      expect.arrayContaining([
        "public.classified_likes",
        "public.question_answer_likes",
        "public.event_participants",
        "public.event_review_helpfulness",
        "public.event_reminders",
      ]),
    );
    expect(section("community_membership_and_actions")?.exclude).toEqual(
      expect.arrayContaining([
        "event_participants.checkin_code",
        "event_review_helpfulness.profile_id",
        "event_reminders.profile_id",
      ]),
    );
    expect(section("community_membership_and_actions")?.notes).toContain(
      "current UI no longer advertises reminders",
    );
  });

  it("implements classified sources but does not self-certify rollout", () => {
    for (const source of [
      "profile_username_history",
      "profile_slug_history",
      "business_claims",
      "classified_comments",
      "classified_likes",
      "question_answer_likes",
      "event_participants",
      "event_reviews",
      "event_review_helpfulness",
      "event_reminders",
      "role_history",
      "user_recommended_businesses",
    ]) {
      expect(exportFunction).toContain(`.from("${source}")`);
    }

    expect(exportFunction).toContain(
      "const LGPD_EXPORT_MATRIX_IMPLEMENTATION_COMPLETE = false;",
    );
  });

  it("blocks both browser export entrypoints before any network request", () => {
    const settingsGuard = settingsService.indexOf("assertPrivacyDataExportEnabled();");
    const settingsFetch = settingsService.indexOf(
      'fetch(buildSupabaseFunctionUrl("user-export-data")',
    );
    expect(settingsGuard).toBeGreaterThanOrEqual(0);
    expect(settingsFetch).toBeGreaterThan(settingsGuard);

    const legacyGuard = privacyService.indexOf("assertPrivacyDataExportEnabled();");
    const legacyInvoke = privacyService.indexOf(
      'supabase.functions.invoke("user-export-data")',
    );
    expect(legacyGuard).toBeGreaterThanOrEqual(0);
    expect(legacyInvoke).toBeGreaterThan(legacyGuard);
  });

  it("exposes availability from the same rollout authority", () => {
    expect(settingsService).toContain("static isUserDataExportAvailable(): boolean");
    expect(settingsService).toContain("return isPrivacyDataExportEnabled();");
  });

  it("makes the unavailable rollout explicit in the account privacy UI", () => {
    expect(privacyPage).toContain(
      "const exportAvailable = PrivacySettingsService.isUserDataExportAvailable();",
    );
    expect(privacyPage).toContain("if (!exportAvailable || isExporting) return;");
    expect(privacyPage).toContain("disabled={isExporting || !exportAvailable}");
    expect(privacyPage).toContain("Exportação temporariamente indisponível");
    expect(privacyPage).toContain("Solicitar meus dados à proteção de dados");
    expect(privacyPage).toContain("navigate(DATA_PROTECTION_CONTACT_PATH)");
  });
});
