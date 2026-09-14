import { describe, expect, it } from "vitest";
import {
  isSalvadorCommunityLaunchTerritory,
  SALVADOR_COMMUNITY_LAUNCH_CLUSTER,
  SALVADOR_COMMUNITY_LAUNCH_GROUP_SLUG,
} from "./communityLaunch";

describe("Community launch territory contract", () => {
  it("projects the configured territorial group instead of maintaining a second list", () => {
    expect(SALVADOR_COMMUNITY_LAUNCH_CLUSTER).toEqual([
      { name: "Nordeste de Amaralina", slug: "nordeste-de-amaralina" },
      { name: "Santa Cruz", slug: "santa-cruz" },
      { name: "Vale das Pedrinhas", slug: "vale-das-pedrinhas" },
      { name: "Chapada", slug: "chapada-do-rio-vermelho" },
    ]);
    expect(SALVADOR_COMMUNITY_LAUNCH_GROUP_SLUG).toBe(
      "complexo-do-nordeste-de-amaralina",
    );
  });

  it.each([
    "nordeste-de-amaralina",
    "santa-cruz",
    "vale-das-pedrinhas",
    "chapada-do-rio-vermelho",
    SALVADOR_COMMUNITY_LAUNCH_GROUP_SLUG,
  ])("recognizes %s as part of the configured launch cluster", (slug) => {
    expect(isSalvadorCommunityLaunchTerritory(slug)).toBe(true);
  });

  it("does not preserve the non-canonical chapada slug as a hidden alias", () => {
    expect(isSalvadorCommunityLaunchTerritory("chapada")).toBe(false);
  });

  it("keeps Pituba outside the first Community cluster", () => {
    expect(isSalvadorCommunityLaunchTerritory("pituba")).toBe(false);
  });
});
