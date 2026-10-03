import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const PAGE_PATH = "src/app/pages/OnboardingPage.tsx";

function read(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

describe("Onboarding territory visual SSOT", () => {
  it("projects the active onboarding shell from canonical territory tokens", () => {
    const page = read(PAGE_PATH);

    for (const token of [
      "bg-territory-canvas",
      "bg-territory-surface",
      "bg-territory-raised",
      "border-territory-border",
      "text-territory-brand",
      "text-territory-ink",
      "text-territory-muted",
      "ring-territory-brand",
    ]) {
      expect(page).toContain(token);
    }
  });

  it("does not reintroduce generic theme utilities into the onboarding consumer", () => {
    const page = read(PAGE_PATH);

    for (const legacyUtility of [
      "bg-background",
      "bg-muted",
      "border-border",
      "text-foreground",
      "text-muted-foreground",
      "text-primary",
      "hover:bg-primary",
      "hover:bg-muted",
      "focus:border-primary",
      "focus:bg-background",
      "ring-primary",
    ]) {
      expect(page).not.toContain(legacyUtility);
    }
  });

  it("keeps onboarding selection and confirmation behavior owned by useOnboarding", () => {
    const page = read(PAGE_PATH);

    expect(page).toContain("useOnboarding()");
    expect(page).toContain("onNeighborhoodSelect(neighborhood)");
    expect(page).toContain("setTimeout(() => onConfirm(), 0)");
    expect(page).toContain("onClick={onConfirm}");
  });
});
