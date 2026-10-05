import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const spec = readFileSync(
  "tests/e2e/business-lifecycle-authenticated.spec.ts",
  "utf8",
);

describe("Business lifecycle E2E locator contract", () => {
  it("uses user-visible semantics instead of layout CSS classes", () => {
    expect(spec).not.toContain(".business-management-card");
    expect(spec).toContain('getByRole("heading"');
    expect(spec).toContain('name: "Gerenciar empresa"');
    expect(spec).toContain('name: "Ver página pública"');
    expect(spec).toContain("businessHeading(page, renamedName)");
  });
});
