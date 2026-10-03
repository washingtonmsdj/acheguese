import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");

const CREATE_VISUAL_FILES = [
  "src/modules/business/components/create/BasicInfoStep.tsx",
  "src/modules/business/components/create/ContactLocationStep.tsx",
  "src/modules/business/components/create/ExtrasStep.tsx",
  "src/modules/business/components/create/StepIndicator.tsx",
] as const;

const LEGACY_VISUAL_UTILITIES = [
  "bg-primary",
  "text-primary",
  "border-primary",
  "from-primary",
  "bg-card",
  "border-border",
  "text-foreground",
  "text-muted-foreground",
  "bg-background",
  "via-background",
  "to-background",
  "border-input",
  "bg-muted",
  "ring-ring",
] as const;

describe("Business create visual SSOT", () => {
  it("keeps the active create flow free of generic theme primitives", () => {
    for (const relative of CREATE_VISUAL_FILES) {
      const source = read(relative);
      for (const legacy of LEGACY_VISUAL_UTILITIES) {
        expect(source, `${relative} must not reintroduce ${legacy}`).not.toContain(legacy);
      }
    }
  });

  it("projects create panels and actions from canonical territory tokens", () => {
    for (const relative of CREATE_VISUAL_FILES.slice(0, 3)) {
      const source = read(relative);
      expect(source).toContain("territory-border");
      expect(source).toContain("territory-surface");
      expect(source).toContain("territory-ink");
      expect(source).toContain("territory-brand");
    }

    const basic = read(CREATE_VISUAL_FILES[0]);
    const contact = read(CREATE_VISUAL_FILES[1]);
    const extras = read(CREATE_VISUAL_FILES[2]);
    expect(basic).toContain("bg-territory-sun text-territory-ink");
    expect(contact).toContain("bg-territory-sun text-territory-ink");
    expect(extras).toContain("bg-territory-sun text-territory-ink");

    const indicator = read(CREATE_VISUAL_FILES[3]);
    const pageCss = read("src/modules/business/pages/CriarEmpresaPage.css");
    expect(indicator).toContain("bcr-step__number");
    expect(pageCss).toContain(".bcr-step.is-current .bcr-step__number");
    expect(pageCss).toContain("var(--territory-brand)");
    expect(pageCss).toContain("var(--territory-sun)");
  });
});
