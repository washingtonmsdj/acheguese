import { describe, expect, it } from "vitest";

import { buildCityModuleUrls } from "./CidadeLanding.utils";

describe("buildCityModuleUrls", () => {
  it("mantem a base comunitaria sem duplicar /feed e publica por action query", () => {
    const urls = buildCityModuleUrls({
      cityPath: "/ba/salvador",
      communityBaseUrl: "/comunidade/santa-cruz",
      communityScoped: true,
    });

    expect(urls.home).toBe("/comunidade/santa-cruz");
    expect(urls.feed).toBe("/comunidade/santa-cruz");
    expect(urls.publish).toBe("/comunidade/santa-cruz?action=publicar");
  });

  it("mantem pontos turisticos na superficie publica mesmo no modo comunitario", () => {
    const urls = buildCityModuleUrls({
      cityPath: "/ba/salvador",
      communityBaseUrl: "/comunidade/santa-cruz",
      communityScoped: true,
    });

    expect(urls.touristPoints).toBe("/pontos-turisticos/ba/salvador");
  });
});
