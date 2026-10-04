import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const actionButton = readFileSync(
  "src/modules/business/company/components/ctas/ActionButton.tsx",
  "utf8",
);
const ctasSection = readFileSync(
  "src/modules/business/company/sections/EmpresaCTAsSection.tsx",
  "utf8",
);
const sectionTypes = readFileSync(
  "src/modules/business/company/sections/types.ts",
  "utf8",
);

const directPalette =
  /\b(?:text|bg|border|ring|ring-offset)-(?:teal|cyan|emerald|slate|white|black|amber|rose|sky|gray)(?:[-/\[]|\b)/;

describe("Business detail CTA visual SSOT", () => {
  it("owns CTA presentation through semantic territorial tones", () => {
    expect(sectionTypes).toContain(
      "export type ActionButtonTone = 'action' | 'success' | 'info';",
    );
    expect(sectionTypes).toContain("readonly tone?: ActionButtonTone;");
    expect(sectionTypes).not.toContain("readonly color?: string;");

    expect(ctasSection).toContain('tone="success"');
    expect(ctasSection).toContain('tone="info"');
    expect(ctasSection).not.toMatch(/\bcolor="/);

    expect(actionButton).toContain("territory-action-on-image");
    expect(actionButton).toContain("territory-success");
    expect(actionButton).toContain("territory-info");
    expect(actionButton).toContain("territory-image-overlay");
    expect(actionButton).toContain("territory-on-image");
    expect(actionButton).not.toContain("color ===");
    expect(actionButton).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(actionButton).not.toMatch(/\brgba?\s*\(/);
    expect(actionButton).not.toMatch(directPalette);
  });
});
