import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

describe("G6 Education lead pipeline write boundary", () => {
  it("enforces transitions in the canonical write model, not only the UI", () => {
    const mutations = readFileSync(
      join(ROOT, "src/core/education/services/education.mutations.ts"),
      "utf8",
    );
    expect(mutations).toContain("canMoveEducationLeadToStatus");
    expect(mutations).toContain("Transicao de lead invalida");
    expect(mutations).not.toContain("function isAllowedLeadTransition");
    expect(mutations).not.toContain("const EDUCATION_LEAD_PIPELINE:");
    expect(mutations).toContain("EducationLeadAdminPatch");
    expect(mutations).toContain("payload: EducationLeadAdminPatch");
    expect(mutations).toContain(
      "Campos controlados do lead nao podem ser alterados pelo patch administrativo",
    );
    expect(mutations).toContain("'source_channel'");
    expect(mutations).toContain("'first_contact_at'");
    expect(mutations).toContain("'lost_reason'");
    expect(mutations).toContain("persistEducationLeadUpdate");
    expect(mutations).toContain("getEducationLeadContactValidationError");
    expect(mutations).toContain("normalizeEducationLeadAdminPatch");
    expect(mutations).toContain("desired_grade");
    expect(mutations).toContain("ownerValidationError");
    expect(mutations).toContain("newStatus === 'contacted' && currentStatus !== 'contacted'");
    expect(mutations).toContain("updatePayload.first_contact_at = new Date().toISOString()");
    expect(mutations).toContain("getEducationLeadLostReasonValidationError");
    expect(mutations).toContain("options.lostReason?.trim() ?? null");
    expect(mutations).toContain("previousStatus: currentStatus");
    expect(mutations).toContain(".select('status')");
  });

  it("reports the real previous status when a lead converts", () => {
    const service = readFileSync(
      join(
        ROOT,
        "src/modules/business/education/services/EducationService.ts",
      ),
      "utf8",
    );

    expect(service).toContain("const { data, error, previousStatus }");
    expect(service).toContain("previousStatus !== 'enrolled'");
    expect(service).toContain("{ previousStatus }");
    expect(service).not.toContain("previousStatus: data.status");
  });

  it("does not render advance actions for terminal lead statuses", () => {
    const view = readFileSync(
      join(
        ROOT,
        "src/modules/business/education/components/EducationPipelineView.tsx",
      ),
      "utf8",
    );
    expect(view).toContain("getEducationLeadNextStatuses");
    expect(view).toContain("nextForwardStatus");
    expect(view).toContain("canMarkLost");
    expect(view).toContain("Marcar ${lead.full_name} como perdido");
    expect(view).toContain("Avançar ${lead.full_name} para");
    expect(view).not.toContain("PIPELINE_STAGES[index + 1].status");
  });
});
