import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "src/app/features/business-landing/sections/EmpresasFiltrosSection.tsx",
  "utf8",
);

describe("business directory sort boundary", () => {
  it("accepts select values only through the canonical sort option list", () => {
    expect(source).toContain("const SORT_OPTIONS = [");
    expect(source).toContain("function isBusinessSortOption(value: string)");
    expect(source).toContain("SORT_OPTIONS.some((option) => option.value === value)");
    expect(source).toContain("if (isBusinessSortOption(value))");
    expect(source).toContain("onSortChange(value);");
    expect(source).not.toContain("value as BusinessSortOption");
  });

  it("resolves labels without dynamic object indexing", () => {
    expect(source).toContain("SORT_OPTIONS.find((option) => option.value === value)?.label");
    expect(source).not.toContain("SORT_LABELS[sortBy]");
    expect(source).not.toContain("Object.entries(SORT_LABELS)");
  });
});
