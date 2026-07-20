import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(path: string): string {
  return readFileSync(resolve(path), "utf8");
}

describe("Home header runtime state", () => {
  it("keeps notifications and profile display tied to canonical runtime data", () => {
    const source = readProjectFile("src/app/pages/PublicCityLandingPage.tsx");

    expect(source).toContain("useSessionContext");
    expect(source).toContain("useUnifiedNotifications");
    expect(source).toContain("sessionActions.unreadCount > 0");
    expect(source).toContain("activeProfile?.avatarUrl");
    expect(source).not.toContain("<span>3</span>");
    expect(source).not.toContain('<img src={personaMorador} alt="" />');
  });
});
