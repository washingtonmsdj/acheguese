import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const page = readFileSync(
  resolve(root, "src/modules/work-opportunities/pages/WorkOpportunityDetailPage.tsx"),
  "utf8",
);

describe("work opportunity public action boundary", () => {
  it("does not report success when feedback cannot be persisted", () => {
    expect(page).not.toContain('toast.info("Feedback registrado.")');
    expect(page).toContain('toast.error("Não foi possível identificar esta oportunidade.")');
    expect(page).toContain("await workOpportunityTrustService.submitFeedback");
  });

  it("does not expose telemetry-only interest as a successful action", () => {
    expect(page).not.toContain("Interesse rápido");
    expect(page).not.toContain("quick_interest");
    expect(page).toContain("const opened = tryOpenContact(data.contact_notes)");
    expect(page).toContain("if (!opened)");
    expect(page).toContain("trackInterestConversion");
    expect(page).toContain("trackContactStarted");
  });

  it("shows contact and profile CTAs only when their real target exists", () => {
    expect(page).toContain("contactCanOpen ? (");
    expect(page).toContain("data.contact_notes ? (");
    expect(page).toContain("data.professional.public_url ? (");
    expect(page).not.toContain("professionalPublicRoutes.home()");
    expect(page).not.toContain("navigate(data.professional?.public_url ??");
  });
});
