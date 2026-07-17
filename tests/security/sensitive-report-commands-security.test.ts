import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

const migration = read(
  "supabase/migrations/20260714118000_harden_sensitive_report_commands.sql",
);
const classifiedService = read(
  "src/core/classifieds/services/ClassifiedReportService.ts",
);
const vagaService = read(
  "src/modules/classifieds/jobs/services/VagaReportService.ts",
);
const reviewService = read(
  "src/core/reviews/services/ReviewEngagementService.ts",
);
const rideService = read("src/core/mobility/services/RideReportsService.ts");

function publicFunctionParameters(name: string): string {
  const match = migration.match(
    new RegExp(
      `CREATE OR REPLACE FUNCTION public\\.${name}\\s*\\(([\\s\\S]*?)\\)\\s*RETURNS`,
    ),
  );
  expect(match, `${name} signature`).not.toBeNull();
  return match?.[1] ?? "";
}

describe("sensitive report server-owned commands", () => {
  it("keeps one domain table per aggregate instead of a polymorphic report table", () => {
    for (const table of [
      "classified_reports",
      "vaga_reports",
      "review_reports",
      "ride_reports",
    ]) {
      expect(migration).toContain(`ON public.${table}`);
      expect(migration).toContain(
        `REVOKE INSERT, UPDATE, DELETE ON public.${table} FROM authenticated`,
      );
    }
    expect(migration).not.toContain("CREATE TABLE public.reports");
  });

  it("does not accept reporter or moderator identity in public RPC signatures", () => {
    for (const command of [
      "create_classified_report",
      "moderate_classified_report",
      "create_vaga_report",
      "moderate_vaga_report",
      "create_review_report",
      "moderate_review_report",
      "create_ride_report",
      "moderate_ride_report",
    ]) {
      expect(publicFunctionParameters(command)).not.toMatch(
        /p_(?:reporter|reviewed_by|moderator_id|admin_profile|actor_profile|user_id)/i,
      );
    }
  });

  it("derives active actors and protects immutable report identity", () => {
    expect(migration.match(/private\.current_active_profile_id\(\)/g)?.length).toBeGreaterThan(8);
    for (const domain of ["classified", "vaga", "review", "ride"]) {
      expect(migration).toContain(`${domain}_report_identity_is_immutable`);
      expect(migration).toContain(`${domain}_report_rate_limit_exceeded`);
    }
    expect(migration.match(/self_report_not_allowed/g)?.length).toBe(3);
    expect(migration).toContain("ride_report_participant_required");
    expect(migration).toContain("ride_report_already_pending");
  });

  it("stores an append-only audit envelope without report prose or evidence URLs", () => {
    expect(migration).toContain("private.sensitive_report_audit_log");
    expect(migration).toContain("REVOKE ALL ON TABLE private.sensitive_report_audit_log");
    const auditFunction = migration.match(
      /CREATE OR REPLACE FUNCTION private\.audit_sensitive_report_write\(\)([\s\S]*?)REVOKE ALL ON FUNCTION private\.audit_sensitive_report_write/,
    )?.[1];
    expect(auditFunction).toBeDefined();
    expect(auditFunction).not.toMatch(/v_new->>'(?:description|evidence_urls|admin_notes|moderator_notes)'/);
    expect(migration).toContain("excludes free-text content and evidence URLs");
  });

  it("uses only typed RPC commands for report mutations", () => {
    const expectations = [
      [classifiedService, "create_classified_report", "moderate_classified_report", "classified_reports"],
      [vagaService, "create_vaga_report", "moderate_vaga_report", "vaga_reports"],
      [reviewService, "create_review_report", null, "review_reports"],
      [rideService, "create_ride_report", "moderate_ride_report", "ride_reports"],
    ] as const;

    for (const [source, createCommand, moderateCommand, table] of expectations) {
      expect(source).toContain(`rpc("${createCommand}"`);
      if (moderateCommand) expect(source).toContain(`rpc("${moderateCommand}"`);
      expect(source).not.toMatch(
        new RegExp(
          `\\.from\\("${table}"\\)[\\s\\S]{0,300}\\.(?:insert|update|delete)\\(`,
        ),
      );
    }
  });

  it("removes privileged actor fields from browser create contracts", () => {
    const rideCreateContract = rideService.slice(
      rideService.indexOf("export interface CreateReportInput"),
      rideService.indexOf("export interface UpdateReportInput"),
    );
    expect(rideCreateContract).not.toMatch(/reporterProfileId|reporterType|profile_id/);
    expect(reviewService).not.toContain("reporter_profile_id: input.reporter_profile_id");
    expect(read("src/modules/classifieds/pages/ClassificadoDetailPage.tsx")).not.toContain(
      "createReport(activeProfile.id",
    );
    expect(read("src/modules/classifieds/jobs/hooks/useVagaDetail.ts")).not.toContain(
      "createReport(activeProfile.id",
    );
  });

  it("tracks the remaining Trust and Messaging actor-authority gap explicitly", () => {
    const architecture = read("docs/architecture/CORE_PLATFORM_ARCHITECTURE_SSOT.md");
    const plan = read("plans/CORE_PLATFORM_CONSOLIDATION_PLAN.md");
    expect(architecture).toContain("CP-014");
    expect(plan).toContain("Trust/Messaging incident commands");
  });
});
