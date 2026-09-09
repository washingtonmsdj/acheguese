import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(path), "utf8");
}

describe("Territory Home runtime state", () => {
  it("keeps session and notification state on the canonical Territory Home", () => {
    const home = readProjectFile(
      "src/app/pages/TerritoryHomePage.tsx",
    );
    const topbar = readProjectFile(
      "src/shared/components/territory-vivo/TerritoryTopbar.tsx",
    );

    expect(home).toContain("useSessionContext");
    expect(home).toContain("useUnifiedNotifications");
    expect(home).toContain("activeProfile?.displayName");
    expect(home).toContain("unreadCount={unreadCount}");
    expect(home).toContain("<TerritoryTopbar");

    expect(topbar).toContain("unreadCount");
    expect(topbar).not.toContain("<span>3</span>");
  });
});
