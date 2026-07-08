import { describe, expect, it } from "vitest";

import { resolveSeoPolicy } from "@/core/routing/seo/territorialSeoPolicy";

describe("resolveSeoPolicy", () => {
  it("mantem paginas publicas de entidade indexaveis com canonical self", () => {
    const businessPolicy = resolveSeoPolicy(
      "/empresas/ba/salvador/pituba/padaria-x",
    );
    const gastronomyPolicy = resolveSeoPolicy(
      "/gastronomia/ba/salvador/pituba/pizzaria-x",
    );

    expect(businessPolicy.robots).toBe(
      "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    );
    expect(businessPolicy.canonicalPath).toBe(
      "/empresas/ba/salvador/pituba/padaria-x",
    );
    expect(gastronomyPolicy.robots).toBe(
      "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    );
    expect(gastronomyPolicy.canonicalPath).toBe(
      "/gastronomia/ba/salvador/pituba/pizzaria-x",
    );
  });

  it("aplica noindex e canonical do modulo para modulo duplicado dentro da comunidade municipal", () => {
    const policy = resolveSeoPolicy("/comunidade/ba/salvador/empresas");

    expect(policy.robots).toBe("noindex, follow");
    expect(policy.canonicalPath).toBe("/empresas/ba/salvador");
  });

  it("aplica noindex e canonical publico para modulo duplicado dentro da comunidade (bairro)", () => {
    const policy = resolveSeoPolicy("/comunidade/ba/salvador/nordeste-de-amaralina/empresas");

    expect(policy.robots).toBe("noindex, follow");
    expect(policy.canonicalPath).toBe("/empresas/ba/salvador/nordeste-de-amaralina");
  });

  it("aplica noindex e canonical publico para modulo duplicado dentro da comunidade (grupo territorial)", () => {
    const policy = resolveSeoPolicy(
      "/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/servicos",
    );

    expect(policy.robots).toBe("noindex, follow");
    expect(policy.canonicalPath).toBe("/servicos/ba/salvador/complexo-do-nordeste-de-amaralina");
  });

  it("mantem noindex para rotas sociais proprias da comunidade", () => {
    const feedPolicy = resolveSeoPolicy("/comunidade/ba/salvador/feed");
    const groupsPolicy = resolveSeoPolicy("/comunidade/ba/salvador/grupos");

    expect(feedPolicy.robots).toBe("noindex, follow");
    expect(feedPolicy.canonicalPath).toBe("/comunidade/ba/salvador/feed");
    expect(groupsPolicy.robots).toBe("noindex, follow");
    expect(groupsPolicy.canonicalPath).toBe("/comunidade/ba/salvador/grupos");
  });

  it("mantem noindex para rota social escopada por territorio", () => {
    const policy = resolveSeoPolicy("/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/feed");

    expect(policy.robots).toBe("noindex, follow");
    expect(policy.canonicalPath).toBe("/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/feed");
  });

  it("mantem noindex para portal por alias curto", () => {
    const portalPolicy = resolveSeoPolicy("/comunidade/complexo-do-nordeste-de-amaralina");
    const feedPolicy = resolveSeoPolicy("/comunidade/complexo-do-nordeste-de-amaralina/feed");

    expect(portalPolicy.robots).toBe("noindex, follow");
    expect(portalPolicy.canonicalPath).toBe("/comunidade/complexo-do-nordeste-de-amaralina");
    expect(feedPolicy.robots).toBe("noindex, follow");
    expect(feedPolicy.canonicalPath).toBe("/comunidade/complexo-do-nordeste-de-amaralina/feed");
  });
});
