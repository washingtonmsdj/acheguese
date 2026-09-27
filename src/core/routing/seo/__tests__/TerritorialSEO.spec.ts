import { describe, expect, it } from "vitest";

import { resolveSeoPolicy } from "@/core/routing/seo/territorialSeoPolicy";

const PUBLIC_ROBOTS =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

describe("resolveSeoPolicy", () => {
  it("keeps territory-first public entity pages self-canonical and indexable", () => {
    const businessPath = "/ba/salvador/pituba/empresas/padaria-x";
    const gastronomyPath = "/ba/salvador/pituba/gastronomia/pizzaria-x";

    expect(resolveSeoPolicy(businessPath)).toEqual({
      canonicalPath: businessPath,
      robots: PUBLIC_ROBOTS,
    });
    expect(resolveSeoPolicy(gastronomyPath)).toEqual({
      canonicalPath: gastronomyPath,
      robots: PUBLIC_ROBOTS,
    });
  });

  it("keeps territory-first public module pages self-canonical", () => {
    for (const path of [
      "/ba/salvador/pituba/empresas",
      "/ba/salvador/pituba/mapa",
      "/ba/salvador/pituba/perto-de-mim",
      "/ba/salvador/pituba/busca",
    ]) {
      expect(resolveSeoPolicy(path)).toEqual({
        canonicalPath: path,
        robots: PUBLIC_ROBOTS,
      });
    }
  });

  it("keeps Community noindex inside the territorial hierarchy", () => {
    for (const path of [
      "/ba/salvador/pituba/comunidade",
      "/ba/salvador/pituba/comunidade/feed",
      "/ba/salvador/pituba/comunidade/grupos",
      "/ba/salvador/complexo-do-nordeste-de-amaralina/comunidade",
    ]) {
      expect(resolveSeoPolicy(path)).toEqual({
        canonicalPath: path,
        robots: "noindex, follow",
      });
    }
  });

  it("does not turn retired module-first URLs into a new canonical target", () => {
    const retired = "/empresas/ba/salvador/pituba/padaria-x";
    expect(resolveSeoPolicy(retired)).toEqual({
      canonicalPath: retired,
      robots: PUBLIC_ROBOTS,
    });
  });

  it("normalizes trailing slash and ignores query/hash in the canonical path", () => {
    expect(resolveSeoPolicy("/ba/salvador/pituba/mapa/?camada=empresas#top")).toEqual({
      canonicalPath: "/ba/salvador/pituba/mapa",
      robots: PUBLIC_ROBOTS,
    });
  });
});
