import { describe, expect, it } from "vitest";

import { resolveSeoPolicy } from "@/core/routing/seo/territorialSeoPolicy";

describe("resolveSeoPolicy", () => {
  it("marca rota de comunidade sem territorySlug real como invalida, sem canonical legado", () => {
    const policy = resolveSeoPolicy("/comunidade/ba/salvador/empresas");

    expect(policy.robots).toBe("noindex, follow");
    expect(policy.canonicalPath).toBe("/comunidade/ba/salvador/empresas");
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

  it("mantem index para rotas sociais proprias da comunidade", () => {
    const feedPolicy = resolveSeoPolicy("/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/feed");
    const groupsPolicy = resolveSeoPolicy(
      "/comunidade/ba/salvador/nordeste-de-amaralina/grupos",
    );

    expect(feedPolicy.robots).toContain("index, follow");
    expect(feedPolicy.canonicalPath).toBe("/comunidade/ba/salvador/complexo-do-nordeste-de-amaralina/feed");
    expect(groupsPolicy.robots).toContain("index, follow");
    expect(groupsPolicy.canonicalPath).toBe("/comunidade/ba/salvador/nordeste-de-amaralina/grupos");
  });
});
