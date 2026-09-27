import { describe, expect, it } from "vitest";
import { jobPublicRoutes } from "../jobPublicRoutes";

describe("jobPublicRoutes", () => {
  it("builds canonical city and detail URLs", () => {
    expect(jobPublicRoutes.home()).toBe("/vagas");
    expect(jobPublicRoutes.publish()).toBe("/vagas/publicar");
    expect(jobPublicRoutes.list({ state: "BA", city: "Salvador" })).toBe("/ba/salvador/vagas");
    expect(
      jobPublicRoutes.detail({
        state: "ba",
        city: "salvador",
        slug: "analista-de-suporte",
      }),
    ).toBe("/ba/salvador/vagas/analista-de-suporte");
  });

  it("derives canonical city URLs from district geographic paths", () => {
    expect(jobPublicRoutes.listFromGeographicPath("/br/ba/salvador/pituba")).toBe(
      "/ba/salvador/vagas",
    );
    expect(
      jobPublicRoutes.detailFromGeographicPath(
        "/br/ba/salvador/pituba",
        "auxiliar-administrativo",
      ),
    ).toBe("/ba/salvador/vagas/auxiliar-administrativo");
  });

  it("rejects unsafe path segments", () => {
    expect(() =>
      jobPublicRoutes.detail({
        state: "ba",
        city: "salvador",
        slug: "../admin",
      }),
    ).toThrow("slug da vaga");
  });
});
