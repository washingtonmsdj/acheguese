import { describe, expect, it } from "vitest";
import {
  isSalvadorCommunityLaunchTerritory,
  SALVADOR_COMMUNITY_LAUNCH_GROUP_SLUG,
} from "./communityLaunch";

describe("Community launch territory contract", () => {
  it.each([
    "nordeste-de-amaralina",
    "santa-cruz",
    "vale-das-pedrinhas",
    "chapada",
    SALVADOR_COMMUNITY_LAUNCH_GROUP_SLUG,
  ])("recognizes %s as part of the first Salvador cluster", (slug) => {
    expect(isSalvadorCommunityLaunchTerritory(slug)).toBe(true);
  });

  it("keeps Pituba outside the first Community cluster", () => {
    expect(isSalvadorCommunityLaunchTerritory("pituba")).toBe(false);
  });
});
