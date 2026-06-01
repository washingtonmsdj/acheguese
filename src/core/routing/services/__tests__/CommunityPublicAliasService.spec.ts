import { beforeEach, describe, expect, it, vi } from "vitest";

import { CommunityPublicAliasService } from "../CommunityPublicAliasService";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  createLocationRepository: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    from: mocks.from,
  },
}));

vi.mock("@/core/location/repositories/createLocationRepository", () => ({
  createLocationRepository: mocks.createLocationRepository,
}));

type SupabaseResponse = {
  data: unknown;
  error: unknown;
};

let responseQueue: SupabaseResponse[] = [];

function queueSupabaseResponse(data: unknown, error: unknown = null) {
  responseQueue.push({ data, error });
}

function createQueryBuilder(response: SupabaseResponse) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    limit: vi.fn(async () => response),
    maybeSingle: vi.fn(async () => response),
  };

  return builder;
}

function mockCityLocation(geographicPath = "/br/ba/salvador") {
  mocks.createLocationRepository.mockReturnValue({
    findById: vi.fn().mockResolvedValue({
      id: "city-1",
      geographic_path: geographicPath,
    }),
  });
}

describe("CommunityPublicAliasService", () => {
  beforeEach(() => {
    responseQueue = [];
    mocks.from.mockReset();
    mocks.createLocationRepository.mockReset();
    mocks.from.mockImplementation(() => {
      const response = responseQueue.shift();
      if (!response) {
        throw new Error("Supabase response not queued for CommunityPublicAliasService test.");
      }
      return createQueryBuilder(response);
    });
    mockCityLocation();
  });

  it("resolve alias publico explicito e normaliza maiusculas", async () => {
    queueSupabaseResponse({
      alias: "chapada",
      territory_community_id: "community-1",
      status: "active",
    });
    queueSupabaseResponse({
      id: "community-1",
      slug: "chapada-do-rio-vermelho",
      city_id: "city-1",
      territory_type: "district",
      territory_id: "district-1",
      status: "active",
    });

    const result = await CommunityPublicAliasService.resolve("Chapada");

    expect(result).toMatchObject({
      status: "resolved",
      alias: "chapada",
      canonicalPath: "/comunidade/ba/salvador/chapada-do-rio-vermelho",
      publicTerritoryPath: "/ba/salvador/chapada-do-rio-vermelho",
      territoryType: "district",
      territoryId: "district-1",
    });
    expect(mocks.from).toHaveBeenNthCalledWith(1, "community_public_aliases");
    expect(mocks.from).toHaveBeenNthCalledWith(2, "territory_communities");
  });

  it("usa slug de comunidade quando ele e unico globalmente", async () => {
    queueSupabaseResponse(null);
    queueSupabaseResponse([
      {
        id: "community-1",
        slug: "santa-cruz",
        city_id: "city-1",
        territory_type: "district",
        territory_id: "district-1",
        status: "active",
      },
    ]);

    const result = await CommunityPublicAliasService.resolve("santa-cruz");

    expect(result).toMatchObject({
      status: "resolved",
      alias: "santa-cruz",
      canonicalPath: "/comunidade/ba/salvador/santa-cruz",
      publicTerritoryPath: "/ba/salvador/santa-cruz",
    });
    expect(mocks.from).toHaveBeenCalledTimes(2);
  });

  it("bloqueia slug ambiguo em vez de escolher uma comunidade arbitraria", async () => {
    queueSupabaseResponse(null);
    queueSupabaseResponse([
      {
        id: "community-1",
        slug: "santa-cruz",
        city_id: "city-1",
        territory_type: "district",
        territory_id: "district-1",
        status: "active",
      },
      {
        id: "community-2",
        slug: "santa-cruz",
        city_id: "city-2",
        territory_type: "district",
        territory_id: "district-2",
        status: "active",
      },
    ]);

    const result = await CommunityPublicAliasService.resolve("santa-cruz");

    expect(result).toMatchObject({
      status: "ambiguous",
      alias: "santa-cruz",
      reason: "Este alias existe em mais de uma cidade. Use a URL completa da comunidade.",
    });
    expect(mocks.createLocationRepository).not.toHaveBeenCalled();
  });

  it("nao resolve alias curto para tipo territorial fora do contrato publico", async () => {
    queueSupabaseResponse({
      alias: "salvador",
      territory_community_id: "community-city",
      status: "active",
    });
    queueSupabaseResponse({
      id: "community-city",
      slug: "salvador",
      city_id: "city-1",
      territory_type: "city",
      territory_id: "city-1",
      status: "active",
    });

    const result = await CommunityPublicAliasService.resolve("salvador");

    expect(result).toMatchObject({
      status: "not-found",
      alias: "salvador",
      reason: "A comunidade encontrada nao possui territorio canonico valido.",
    });
    expect(mocks.createLocationRepository).not.toHaveBeenCalled();
  });

  it("recusa alias com mais de um segmento", async () => {
    const result = await CommunityPublicAliasService.resolve("santa/cruz");

    expect(result).toMatchObject({
      status: "not-found",
      alias: "santa/cruz",
      reason: "Alias de comunidade invalido.",
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("recusa alias reservado na raiz publica", async () => {
    const result = await CommunityPublicAliasService.resolve("empresas");

    expect(result).toMatchObject({
      status: "not-found",
      alias: "empresas",
      reason: "Alias de comunidade invalido.",
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("recusa alias com cara de UF para preservar landing estadual", async () => {
    const result = await CommunityPublicAliasService.resolve("ba");

    expect(result).toMatchObject({
      status: "not-found",
      alias: "ba",
      reason: "Alias de comunidade invalido.",
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("monta URL publica curta a partir do territorio quando existe alias ativo", async () => {
    queueSupabaseResponse([
      {
        id: "community-1",
        slug: "santa-cruz",
        city_id: "city-1",
        territory_type: "district",
        territory_id: "district-1",
        status: "active",
      },
    ]);
    queueSupabaseResponse({
      alias: "santa-cruz-salvador",
      territory_community_id: "community-1",
      status: "active",
    });

    const result = await CommunityPublicAliasService.findPublicUrlForTerritory({
      kind: "location",
      territoryId: "district-1",
    });

    expect(result).toBe("/santa-cruz-salvador");
    expect(mocks.from).toHaveBeenNthCalledWith(1, "territory_communities");
    expect(mocks.from).toHaveBeenNthCalledWith(2, "community_public_aliases");
  });

  it("usa slug global unico como fallback reverso quando alias explicito nao existe", async () => {
    queueSupabaseResponse([
      {
        id: "community-1",
        slug: "complexo-do-nordeste-de-amaralina",
        city_id: "city-1",
        territory_type: "territorial_group",
        territory_id: "group-1",
        status: "active",
      },
    ]);
    queueSupabaseResponse(null);
    queueSupabaseResponse([
      {
        id: "community-1",
        slug: "complexo-do-nordeste-de-amaralina",
        city_id: "city-1",
        territory_type: "territorial_group",
        territory_id: "group-1",
        status: "active",
      },
    ]);

    const result = await CommunityPublicAliasService.findPublicUrlForTerritory({
      kind: "group",
      territoryId: "group-1",
    });

    expect(result).toBe("/complexo-do-nordeste-de-amaralina");
    expect(mocks.from).toHaveBeenCalledTimes(3);
  });
});
