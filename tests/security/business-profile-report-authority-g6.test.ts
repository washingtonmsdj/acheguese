import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("G6 business profile report authority", () => {
  it("uses an independent report aggregate with server-owned identity", () => {
    const migration = read(
      "supabase/migrations/20260906090432_add_business_profile_reporting_g6.sql",
    );

    expect(migration).toContain(
      "CREATE TABLE IF NOT EXISTS public.business_profile_reports",
    );
    expect(migration).toContain(
      "NEW.reporter_profile_id := v_actor_profile_id",
    );
    expect(migration).toContain("self_report_not_allowed");
    expect(migration).toContain(
      "business_profile_report_rate_limit_exceeded",
    );
    expect(migration).toContain(
      "business_profile_report_identity_is_immutable",
    );
    expect(migration).toContain(
      "REVOKE INSERT, UPDATE, DELETE\nON public.business_profile_reports",
    );
  });

  it("keeps profile reports separate from review reports and factual corrections", () => {
    const migration = read(
      "supabase/migrations/20260906090432_add_business_profile_reporting_g6.sql",
    );
    const service = read(
      "src/core/business/services/BusinessProfileReportService.ts",
    );

    expect(migration).toContain(
      "Incorrect factual data belongs to correction suggestions, not this table",
    );
    expect(service).toContain('rpc("create_business_profile_report"');
    expect(service).not.toContain("review_reports");
  });

  it("federates business profile reports into the global moderation queue", () => {
    const migration = read(
      "supabase/migrations/20260906090432_add_business_profile_reporting_g6.sql",
    );
    const service = read(
      "src/core/moderation/services/FederatedModerationQueueService.ts",
    );
    const queue = read(
      "src/modules/admin/components/moderation/FederatedModerationQueue.tsx",
    );

    expect(migration).toContain("'business_profile'");
    expect(migration).toContain(
      "FROM public.business_profile_reports r",
    );
    expect(service).toContain('"business_profile"');
    expect(queue).toContain('business_profile: "Perfis de empresas"');
  });

  it("offers Education reporting with a minor-safety reason", () => {
    const sidebar = read(
      "src/modules/business/education/pages/EducationDetailSidebar.tsx",
    );

    expect(sidebar).toContain("Denunciar este perfil");
    expect(sidebar).toContain("'privacy_or_safety'");
    expect(sidebar).toContain(
      "Privacidade ou seguranca de aluno/menor",
    );
    expect(sidebar).toContain("BusinessProfileReportService.report");
  });
});
