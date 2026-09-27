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
  it("gera a URL pública canônica com território antes do módulo", () => {
    expect(BusinessUrlService.getPublicCanonicalUrl(businessContext)).toBe(
      "/ba/salvador/pituba/empresas/padaria-x",
    );
    expect(BusinessUrlService.getCanonicalUrl(businessContext)).toBe(
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

  it("rejeita empresa sem bairro canônico", () => {
    expect(() =>
      BusinessUrlService.getCanonicalUrl({
        ...businessContext,
        geographic_path: "/br/ba/salvador",
      }),
    ).toThrow(/geographic_path inválido/);
  });
});
