import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

describe("MVP private launch-scope boundaries", () => {
  it("keeps every private Education route behind the canonical education gate", () => {
    const routes = read("src/app/routes/sections/CentralRoutes.tsx");
    const educationGates =
      routes.match(/launchElement\("education", "Educação"/g) ?? [];

    expect(educationGates).toHaveLength(7);
    expect(routes).not.toMatch(
      /path="educacao(?:\/[^"]*)?" element=\{<P\.Education/,
    );
  });

  it("keeps Billing hidden from private navigation and routes while paused", () => {
    const launchScope = read("src/app/config/launchScope.ts");
    const routes = read("src/app/routes/sections/CentralRoutes.tsx");
    const profileNavigation = read(
      "src/modules/profile/utils/profileNavigation.ts",
    );
    const profileSummary = read("src/modules/profile/sections/ResumoSection.tsx");

    expect(launchScope).toContain("billing: false");
    expect(routes).toContain(
      'launchElement("billing", "Planos", <P.BusinessPlansPage />)',
    );
    expect(profileNavigation).toContain('planos: "billing"');
    expect(profileSummary).toContain(
      'const showBilling = isLaunchSurfaceEnabled("billing")',
    );
    expect(profileSummary).toContain("{showBilling ? (");
  });
});
