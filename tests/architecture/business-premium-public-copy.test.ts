import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Business premium public copy", () => {
  it("keeps internal module language out of the customer-facing site", () => {
    const content = readFileSync(
      "src/modules/business/premium/pages/PremiumBusinessHomePage.tsx",
      "utf8",
    );

    expect(content).not.toContain("Módulos ativos");
    expect(content).not.toContain("Sem módulos ativos");
    expect(content).toContain("Experiências disponíveis");
  });
});
