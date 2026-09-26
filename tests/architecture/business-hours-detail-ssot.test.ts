import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Business public detail hours SSOT", () => {
  const detail = read("src/app/pages/EmpresaDetailLandingPage.tsx");

  it("consumes BusinessHoursService for authoritative status", () => {
    expect(detail).toContain("BusinessHoursService.getStatus(");
    expect(detail).toContain("BusinessHoursService.getOperationConfig(");
  });

  it("does not reimplement open/close minute arithmetic in the page", () => {
    expect(detail).not.toContain("currentMinutes");
    expect(detail).not.toContain("openMinutes");
    expect(detail).not.toContain("closeMinutes");
    expect(detail).not.toContain('today.open.split(\":\")');
    expect(detail).not.toContain('today.close.split(\":\")');
  });

  it("keeps snapshot status only as a presentation fallback", () => {
    expect(detail).toContain("snapshot?.institutional.openStatus");
    expect(detail).toContain("if (!businessHoursStatus)");
    expect(detail).toContain("return base;");
  });
});
