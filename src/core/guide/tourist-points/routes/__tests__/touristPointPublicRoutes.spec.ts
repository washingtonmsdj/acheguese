import { describe, expect, it } from "vitest";
import { touristPointPublicRoutes } from "../touristPointPublicRoutes";

describe("touristPointPublicRoutes", () => {
  it("builds canonical territory-first listing and detail URLs", () => {
    expect(touristPointPublicRoutes.list({ state: "BA", city: "Salvador" })).toBe(
      "/ba/salvador/pontos-turisticos",
    );
    expect(
      touristPointPublicRoutes.detail({
        state: "BA",
        city: "Salvador",
        district: "Rio Vermelho",
        slug: "Casa de Jorge Amado",
      }),
    ).toBe(
      "/ba/salvador/rio-vermelho/pontos-turisticos/casa-de-jorge-amado",
    );
  });

  it("derives URLs from geographic paths without exposing the country segment", () => {
    expect(
      touristPointPublicRoutes.listFromGeographicPath(
        "/br/ba/salvador/pelourinho",
      ),
    ).toBe("/ba/salvador/pelourinho/pontos-turisticos");
    expect(
      touristPointPublicRoutes.detailFromGeographicPath(
        "/br/ba/salvador/pelourinho",
        "elevador-lacerda",
      ),
    ).toBe(
      "/ba/salvador/pelourinho/pontos-turisticos/elevador-lacerda",
    );
  });

  it("exposes explicit city, district and detail route patterns", () => {
    expect(touristPointPublicRoutes.cityRoutePath()).toBe(
      "/:state/:city/pontos-turisticos",
    );
    expect(touristPointPublicRoutes.districtRoutePath()).toBe(
      "/:state/:city/:district/pontos-turisticos",
    );
    expect(touristPointPublicRoutes.cityDetailRoutePath()).toBe(
      "/:state/:city/pontos-turisticos/:slug",
    );
    expect(touristPointPublicRoutes.districtDetailRoutePath()).toBe(
      "/:state/:city/:district/pontos-turisticos/:slug",
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
