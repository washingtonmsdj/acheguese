import { describe, expect, it } from "vitest";
import { classifiedUrlService } from "../ClassifiedUrlService";

const completeContext = {
  id: "11111111-1111-1111-1111-111111111111",
  public_id: "ab12cd34",
  slug: "armario-de-cozinha",
  geographic_path: "/br/ba/salvador/pituba",
  category_slug: "moveis",
  subcategory_slug: "cozinha",
};

describe("ClassifiedUrlService", () => {
  it("builds canonical, short and edit URLs from a complete context", () => {
    expect(classifiedUrlService.buildUrls(completeContext)).toEqual({
      canonical: "/classificados/ba/salvador/pituba/moveis/cozinha/armario-de-cozinha/ab12cd34",
      short: "/c/ab12cd34",
      edit: "/classificados/editar/11111111-1111-1111-1111-111111111111",
    });
  });

  it("builds the canonical public URL when all public URL fields are present", () => {
    expect(classifiedUrlService.buildPublicUrl(completeContext)).toBe(
      "/classificados/ba/salvador/pituba/moveis/cozinha/armario-de-cozinha/ab12cd34",
    );
  });

  it("falls back to the short URL only when public_id is available", () => {
    expect(classifiedUrlService.buildPublicUrl({
      id: completeContext.id,
      public_id: completeContext.public_id,
    })).toBe("/c/ab12cd34");
  });

  it("falls back to short URL when geographic_path is city-level", () => {
    expect(classifiedUrlService.buildPublicUrl({
      ...completeContext,
      geographic_path: "/br/ba/salvador",
    })).toBe("/c/ab12cd34");
  });

  it("does not expose internal ids when public_id is missing", () => {
    expect(classifiedUrlService.buildPublicUrl({
      id: completeContext.id,
    })).toBeNull();
  });

  it("rejects unsafe route segments", () => {
    expect(() =>
      classifiedUrlService.buildUrls({
        ...completeContext,
        slug: "armario/privado",
      }),
    ).toThrow(/slug/);
  });

  it("rejects unsafe public ids", () => {
    expect(() => classifiedUrlService.buildShortUrl("abc/123")).toThrow(/publicId/);
  });
});
