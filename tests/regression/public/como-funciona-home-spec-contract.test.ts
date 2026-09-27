import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("como funciona public experience contract", () => {
  it("guides first-time visitors from territory to participation", () => {
    const page = read("src/app/pages/ComoFuncionaPage.tsx");

    expect(page).toContain("Primeiro você conhece.");
    expect(page).toContain("Depois, encontra.");
    expect(page).toContain("Comece pelo território");
    expect(page).toContain("Descubra o que está perto");
    expect(page).toContain("Participe quando quiser");
    expect(page).toContain("LAUNCH_URLS.community");
    expect(page).toContain("LAUNCH_URLS.businessTerritory");
    expect(page).toContain("AUTH_PATHS.signup");
  });

  it("keeps the page accessible and responsive in its own visual scope", () => {
    const page = read("src/app/pages/ComoFuncionaPage.tsx");
    const styles = read("src/app/pages/ComoFuncionaPage.css");

    expect(page).toContain('className="ag-guide"');
    expect(page).toContain('id="main-content"');
    expect(page).toContain('aria-labelledby="ag-guide-title"');
    expect(styles).toContain("@media (max-width: 720px)");
    expect(styles).toContain("overflow: hidden;");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
