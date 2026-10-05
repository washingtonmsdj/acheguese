import { describe, expect, it, vi } from "vitest";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";

vi.mock("@/integrations/supabase", () => ({
  supabase: {},
}));

const businessContext = {
  id: "business-1",
  slug: "padaria-x",
  is_premium: false,
  geographic_path: "/br/ba/salvador/pituba",
};

describe("BusinessUrlService", () => {
  it("usa uma única autoridade para toda URL pública canônica", () => {
    const expected = "/ba/salvador/pituba/empresas/padaria-x";

    expect(BusinessUrlService.buildUrls(businessContext).canonical).toBe(expected);
    expect(BusinessUrlService.getPublicCanonicalUrl(businessContext)).toBe(expected);
    expect(BusinessUrlService.getCanonicalUrl(businessContext)).toBe(expected);
  });

  it("aceita o território público equivalente sem o prefixo interno /br", () => {
    const context = {
      ...businessContext,
      geographic_path: "/ba/salvador/pituba",
    };

    expect(BusinessUrlService.getCanonicalUrl(context)).toBe(
      "/ba/salvador/pituba/empresas/padaria-x",
    );
    expect(BusinessUrlService.getPublicCanonicalUrl(context)).toBe(
      "/ba/salvador/pituba/empresas/padaria-x",
    );
  });

  it("mantém o link premium isolado sem alterar a URL territorial canônica", () => {
    expect(
      BusinessUrlService.getShareUrl({
        ...businessContext,
        is_premium: true,
      }),
    ).toBe("/p/padaria-x");

    expect(
      BusinessUrlService.getCanonicalUrl({
        ...businessContext,
        is_premium: true,
      }),
    ).toBe("/ba/salvador/pituba/empresas/padaria-x");
  });

  it("rejeita empresa sem território canônico completo em todos os aliases", () => {
    const invalidContext = {
      ...businessContext,
      geographic_path: "/br/ba/salvador",
    };

    expect(() => BusinessUrlService.buildUrls(invalidContext)).toThrow(
      /geographic_path inválido/,
    );
    expect(() => BusinessUrlService.getCanonicalUrl(invalidContext)).toThrow(
      /geographic_path inválido/,
    );
    expect(() => BusinessUrlService.getPublicCanonicalUrl(invalidContext)).toThrow(
      /geographic_path inválido/,
    );
  });

  it("rejeita segmentos territoriais extras em vez de truncar ou criar duas canônicas", () => {
    const invalidContext = {
      ...businessContext,
      geographic_path: "/br/ba/salvador/pituba/extra",
    };

    expect(() => BusinessUrlService.buildUrls(invalidContext)).toThrow(
      /geographic_path inválido/,
    );
    expect(() => BusinessUrlService.getCanonicalUrl(invalidContext)).toThrow(
      /geographic_path inválido/,
    );
    expect(() => BusinessUrlService.getPublicCanonicalUrl(invalidContext)).toThrow(
      /geographic_path inválido/,
    );
  });

  it("rejeita geographic_path territorial inseguro antes de gerar qualquer canônica", () => {
    for (const geographicPath of [
      "/br/ba/salvador/pituba?next=/admin",
      "/br/ba/salvador/pituba#admin",
      "/br/ba/salvador/pituba\\admin",
      "/br/ba/salvador/%2fadmin",
      "/br/ba/salvador/%252fadmin",
    ]) {
      const invalidContext = {
        ...businessContext,
        geographic_path: geographicPath,
      };

      expect(() => BusinessUrlService.getCanonicalUrl(invalidContext)).toThrow(
        /geographic_path inválido/,
      );
      expect(() => BusinessUrlService.getPublicCanonicalUrl(invalidContext)).toThrow(
        /geographic_path inválido/,
      );
    }
  });
});