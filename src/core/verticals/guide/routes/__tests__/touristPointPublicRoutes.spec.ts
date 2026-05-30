import { describe, expect, it } from "vitest";
import { touristPointPublicRoutes } from "../touristPointPublicRoutes";

describe("touristPointPublicRoutes", () => {
  it("builds canonical territorial listing and detail URLs", () => {
    expect(touristPointPublicRoutes.list({ state: "BA", city: "Salvador" })).toBe(
      "/pontos-turisticos/ba/salvador",
    );
    expect(
      touristPointPublicRoutes.detail({
        state: "BA",
        city: "Salvador",
        district: "Rio Vermelho",
        slug: "Casa de Jorge Amado",
      }),
    ).toBe("/pontos-turisticos/ba/salvador/rio-vermelho/casa-de-jorge-amado");
  });

  it("derives URLs from geographic paths without exposing the country segment", () => {
    expect(touristPointPublicRoutes.listFromGeographicPath("/br/ba/salvador/pelourinho")).toBe(
      "/pontos-turisticos/ba/salvador/pelourinho",
    );
    expect(
      touristPointPublicRoutes.detailFromGeographicPath(
        "/br/ba/salvador/pelourinho",
        "elevador-lacerda",
      ),
    ).toBe("/pontos-turisticos/ba/salvador/pelourinho/elevador-lacerda");
  });

  it("exposes route patterns through the same SSOT", () => {
    expect(touristPointPublicRoutes.cityRoutePath()).toBe(
      "/pontos-turisticos/:state/:city",
    );
    expect(touristPointPublicRoutes.districtOrDetailRoutePath()).toBe(
      "/pontos-turisticos/:state/:city/:groupSlugOrDistrict",
    );
    expect(touristPointPublicRoutes.detailWithTerritoryRoutePath()).toBe(
      "/pontos-turisticos/:state/:city/:groupSlugOrDistrict/:slug",
    );
  });

  it("rejects unsafe route segments", () => {
    expect(() =>
      touristPointPublicRoutes.detail({
        state: "ba",
        city: "salvador",
        slug: "museu?x=1",
      }),
    ).toThrow(/slug do ponto turistico/);
  });
});
