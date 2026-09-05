import { describe, expect, it } from "vitest";
import { EducationService } from "../EducationService";

describe("Education lead pipeline transition contract", () => {
  it("allows the next stage and lost from active statuses", () => {
    expect(EducationService.canMoveLeadToStatus("new", "contacted")).toBe(true);
    expect(EducationService.canMoveLeadToStatus("contacted", "visit_scheduled")).toBe(true);
    expect(EducationService.canMoveLeadToStatus("proposal_sent", "enrolled")).toBe(true);
    expect(EducationService.canMoveLeadToStatus("new", "lost")).toBe(true);
  });

  it("rejects skips, backwards moves and transitions out of terminal statuses", () => {
    expect(EducationService.canMoveLeadToStatus("new", "proposal_sent")).toBe(false);
    expect(EducationService.canMoveLeadToStatus("proposal_sent", "contacted")).toBe(false);
    expect(EducationService.canMoveLeadToStatus("enrolled", "lost")).toBe(false);
    expect(EducationService.canMoveLeadToStatus("lost", "contacted")).toBe(false);
  });

  it("allows same-status retries to converge idempotently", () => {
    expect(EducationService.canMoveLeadToStatus("contacted", "contacted")).toBe(true);
    expect(EducationService.canMoveLeadToStatus("enrolled", "enrolled")).toBe(true);
  });
});
