import { describe, expect, it } from "vitest";
import {
  COMMUNITY_FEED_COPY,
  COMMUNITY_LOCATION_SCOPE_COPY,
  COMMUNITY_PAGE_COPY,
  COMMUNITY_POST_CARD_COPY,
} from "@/core/community-feed/utils/communityCopy";

describe("communityCopy SSOT", () => {
  it("keeps critical feed labels stable", () => {
    expect(COMMUNITY_FEED_COPY.composerTitle).toBe("O que você quer compartilhar com o bairro?");
    expect(COMMUNITY_FEED_COPY.headerFiltersAriaLabel).toBe("Filtros principais do feed");
    expect(COMMUNITY_FEED_COPY.sortAriaLabel).toBe("Ordenação do feed");
  });

  it("keeps critical page labels stable", () => {
    expect(COMMUNITY_PAGE_COPY.loginRequiredTitle).toBe("Faça login para acessar a comunidade");
    expect(COMMUNITY_PAGE_COPY.rolloutBlockedTitle).toBe("Comunidade ainda não liberada");
    expect(COMMUNITY_PAGE_COPY.subcategoryNavAriaLabel).toBe("Subcategorias da comunidade");
  });

  it("keeps location scope labels stable", () => {
    expect(COMMUNITY_LOCATION_SCOPE_COPY.cityLabel).toBe("Toda a cidade");
    expect(COMMUNITY_LOCATION_SCOPE_COPY.neighborhoodGroupLabel).toBe("Toda a área");
    expect(COMMUNITY_LOCATION_SCOPE_COPY.streetLabel).toBe("Minha rua");
  });

  it("keeps post card labels stable", () => {
    expect(COMMUNITY_POST_CARD_COPY.territoryOpportunityLabel).toBe(
      "Entidade territorial de oportunidade",
    );
    expect(COMMUNITY_POST_CARD_COPY.locationFallback).toBe("Localização não informada");
    expect(COMMUNITY_POST_CARD_COPY.openPostDetailsAriaLabel).toBe("Abrir detalhes do post");
  });
});
