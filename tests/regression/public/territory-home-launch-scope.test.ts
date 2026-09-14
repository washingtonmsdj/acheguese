import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { isLaunchSurfaceEnabled } from "../../../src/app/config/launchScope";

function read(filePath: string): string {
  return fs.readFileSync(path.resolve(filePath), "utf-8");
}

describe("Territory Home launch-scope regression", () => {
  it("keeps paused launch modules disabled", () => {
    expect(isLaunchSurfaceEnabled("mobility")).toBe(false);
    expect(isLaunchSurfaceEnabled("education")).toBe(false);
  });

  it("gates every quick action through its launch surface", () => {
    const source = read("src/app/pages/TerritoryHomePage.tsx");

    expect(source).toContain('surface: "gastronomy"');
    expect(source).toContain('surface: "business"');
    expect(source).toContain('surface: "services"');
    expect(source).toContain('surface: "mobility"');
    expect(source).toContain('surface: "classifieds"');
    expect(source).toContain('surface: "education"');
    expect(source).toContain(
      "actions.filter((action) => isLaunchSurfaceEnabled(action.surface))",
    );
    expect(source).not.toContain(
      'action.href !== urls.gastronomy || isLaunchSurfaceEnabled("gastronomy")',
    );
  });

  it("does not reserve six desktop columns when paused actions are hidden", () => {
    const source = read("src/app/pages/TerritoryHomePage.tsx");

    expect(source).toContain(
      "md:grid-cols-[repeat(auto-fit,minmax(7rem,1fr))]",
    );
    expect(source).not.toContain("md:grid-cols-6 md:gap-6");
  });
});
