import { describe, expect, it } from "vitest";

import { professionalPublicRoutes } from "../professionalPublicRoutes";

describe("professionalPublicRoutes", () => {
  it("builds service-module canonical routes", () => {
    expect(professionalPublicRoutes.home()).toBe("/servicos");
    expect(professionalPublicRoutes.register()).toBe("/servicos/cadastrar");
    expect(professionalPublicRoutes.list({ state: "BA", city: "Salvador" })).toBe(
      "/servicos/ba/salvador",
    );
    expect(
      professionalPublicRoutes.detail({
        state: "BA",
        city: "Salvador",
        slug: "joao-eletricista",
      }),
    ).toBe("/servicos/ba/salvador/profissional/joao-eletricista");
  });

  it("derives city routes from canonical geographic_path", () => {
    expect(
      professionalPublicRoutes.detailFromGeographicPath(
        "/br/ba/salvador/pituba",
        "maria-arquiteta",
      ),
    ).toBe("/servicos/ba/salvador/profissional/maria-arquiteta");
  });

  it("exposes route patterns and previews from the same SSOT", () => {
    expect(professionalPublicRoutes.detailRoutePath()).toBe(
      "/servicos/:state/:city/profissional/:slug",
    );
    expect(professionalPublicRoutes.detailPreview("ana-designer")).toBe(
      "/servicos/:state/:city/profissional/ana-designer",
    );
  });

  it("rejects multi-segment or unsafe detail slugs", () => {
    expect(() =>
      professionalPublicRoutes.detail({
        state: "ba",
        city: "salvador",
        slug: "../admin",
      }),
    ).toThrow(/slug do profissional/);
  });
});
