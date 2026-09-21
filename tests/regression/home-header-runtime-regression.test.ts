import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(path), "utf8");
}

describe("Territory Home runtime state", () => {
  it("keeps account and notification runtime out of the lightweight public Home", () => {
    const home = readProjectFile("src/app/pages/TerritoryHomePage.tsx");

    expect(home).not.toContain("useSessionContext");
    expect(home).not.toContain("useUnifiedNotifications");
    expect(home).not.toContain("TerritoryTopbar");
    expect(home).not.toContain("activeProfile");
    expect(home).not.toContain("unreadCount");
  });
});
