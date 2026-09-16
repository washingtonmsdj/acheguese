import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("G140 active ride open-only projection", () => {
  const hook = readProjectFile("src/modules/mobility/hooks/useActiveRide.ts");

  it("does not load terminal ride history just to resolve the active ride", () => {
    expect(hook).toContain("profileService.getActiveProfile(user.id)");
    expect(hook).toContain("getActiveRide(activeProfile.id)");
    expect(hook).not.toContain("getUserRides");
    expect(hook).not.toContain("isOpenRideStatus");
  });
});
