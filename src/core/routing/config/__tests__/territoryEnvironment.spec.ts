import { describe, expect, it } from "vitest";

import { resolveLaunchTerritoryEnvironment } from "../territoryEnvironment";

describe("resolveLaunchTerritoryEnvironment", () => {
  it("normalizes configured launch territory without depending on Vite globals", () => {
    expect(
      resolveLaunchTerritoryEnvironment({
        VITE_LAUNCH_COUNTRY: " BR ",
        VITE_LAUNCH_STATE: " BA ",
        VITE_LAUNCH_CITY: " Salvador ",
        VITE_LAUNCH_CITY_NAME: " Salvador ",
        VITE_LAUNCH_COMMUNITY_SLUG: "complexo-do-nordeste-de-amaralina",
        VITE_LAUNCH_COMMUNITY_NAME: "Complexo do Nordeste de Amaralina",
      }),
    ).toEqual({
      country: "br",
      state: "ba",
      city: "salvador",
      cityName: "Salvador",
      communitySlug: "complexo-do-nordeste-de-amaralina",
      communityName: "Complexo do Nordeste de Amaralina",
      cityPath: "/ba/salvador",
      communityPath: "/ba/salvador/complexo-do-nordeste-de-amaralina",
    });
  });

  it("fails to generic territory paths instead of inventing a launch geography", () => {
    expect(resolveLaunchTerritoryEnvironment({})).toEqual({
      country: "br",
      state: "",
      city: "",
      cityName: "Território inicial",
      communitySlug: "",
      communityName: "Território inicial",
      cityPath: "/brasil",
      communityPath: "/brasil",
    });
  });
});
