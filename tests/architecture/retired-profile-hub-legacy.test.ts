import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

const RETIRED_PROFILE_HUB_FILES = [
  "src/modules/profile/components/hub/ProfileSectionsNav.tsx",
  "src/modules/profile/components/hub/ProfileSidebarHeader.tsx",
  "src/modules/profile/components/hub/ProfileSidebarFooter.tsx",
  "src/modules/profile/components/hub/NotificationsPanel.tsx",
  "src/modules/profile/components/hub/HubLinkCard.tsx",
  "src/modules/profile/config/profile-sections.config.ts",
] as const;

describe("retired profile hub legacy", () => {
  it("keeps the superseded internal hub navigation out of the active profile module", () => {
    for (const relativePath of RETIRED_PROFILE_HUB_FILES) {
      expect(fs.existsSync(path.join(ROOT, relativePath)), relativePath).toBe(false);
    }

    const hubIndex = read("src/modules/profile/components/hub/index.ts");
    for (const retiredExport of [
      "ProfileSectionsNav",
      "ProfileSidebarHeader",
      "ProfileSidebarFooter",
      "NotificationsPanel",
      "HubLinkCard",
      "SectionNavItem",
    ]) {
      expect(hubIndex).not.toContain(retiredExport);
    }
  });

  it("keeps the canonical account hub on the compact header without an internal sidebar", () => {
    const layout = read("src/modules/profile/pages/ContaHubLayout.tsx");
    const contract = read(
      "src/modules/profile/__tests__/AccountTerritoryVivo.contract.spec.tsx",
    );

    expect(layout).toContain("ProfileHeaderCompact");
    expect(layout).not.toContain("ProfileSectionsNav");
    expect(layout).not.toContain("<aside");
    expect(contract).toContain('expect(hubLayout).not.toContain("ProfileSectionsNav")');
  });
});
