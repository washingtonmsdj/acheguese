import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

describe("profile hub launch copy", () => {
  const source = read("src/core/profiles/hooks/useProfileHub.ts");

  it("does not advertise Billing in business onboarding while billing is paused", () => {
    expect(source).toContain("const showBilling = isLaunchSurfaceEnabled('billing')");
    expect(source).toContain("description: showBilling");
    expect(source).toContain(
      "Este perfil já pode entrar no fluxo de empresa, dashboard e verticalização.",
    );
  });

  it("preserves the future Billing copy behind the canonical gate", () => {
    expect(source).toContain(
      "Este perfil já pode entrar no fluxo de empresa, dashboard, billing e verticalização.",
    );
    expect(source).toContain("showBilling,");
  });
});
