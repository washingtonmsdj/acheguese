import { describe, expect, it } from "vitest";
import {
  CLASSIFIED_REPORT_REASON_OPTIONS,
  isClassifiedReportReason,
} from "../ClassifiedReportService";

describe("ClassifiedReportService report reasons", () => {
  it("keeps public report reasons unique and valid", () => {
    const ids = CLASSIFIED_REPORT_REASON_OPTIONS.map((reason) => reason.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("wrong-category");
    expect(ids).not.toContain("wrong_category");
  });

  it("validates report reason inputs", () => {
    expect(isClassifiedReportReason("fraud")).toBe(true);
    expect(isClassifiedReportReason("wrong_category")).toBe(false);
    expect(isClassifiedReportReason("")).toBe(false);
  });
});
