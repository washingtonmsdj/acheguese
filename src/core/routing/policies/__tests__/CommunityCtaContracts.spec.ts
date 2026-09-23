import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = resolve(fileURLToPath(import.meta.url), "..");
const repoRoot = resolve(currentDir, "../../../../..");

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("community CTA contracts on public surfaces", () => {
  it("labels public-surface community CTAs as portal entry points", () => {
    const territorialLanding = readProjectFile(
      "src/core/routing/components/TerritorialLandingPage.tsx",
    );
    expect(territorialLanding).toContain("Abrir portal comunitario");
  });

  it("keeps the territorial landing community CTA visually secondary", () => {
    const territorialLanding = readProjectFile(
      "src/core/routing/components/TerritorialLandingPage.tsx",
    );

    expect(territorialLanding).toContain("border border-teal-500/35");
    expect(territorialLanding).toContain("bg-transparent");
    expect(territorialLanding).not.toContain("Entrar na comunidade");
  });
});
