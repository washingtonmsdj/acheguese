import { describe, expect, it } from "vitest";
import {
  VAGA_REPORT_REASON_OPTIONS,
  isVagaReportReason,
} from "../VagaReportService";

describe("VagaReportService report reasons", () => {
  it("keeps job report reasons unique and canonical", () => {
    const ids = VAGA_REPORT_REASON_OPTIONS.map((reason) => reason.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("fake-company");
    expect(ids).toContain("discrimination");
    expect(ids).not.toContain("fake_company");
  });

  it("validates job report reason inputs", () => {
    expect(isVagaReportReason("fraud")).toBe(true);
    expect(isVagaReportReason("fake_company")).toBe(false);
    expect(isVagaReportReason("")).toBe(false);
  });
});
