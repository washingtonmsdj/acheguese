import { beforeEach, describe, expect, it, vi } from "vitest";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { territorialGroupService } from "@/core/territorial";
import { resolveCommunityPublicAliasTerritory } from "../CommunityPublicAliasTerritoryResolver";
import { resolveBusinessEntityFromCommunityAlias } from "../CommunityBusinessEntityResolver";

vi.mock("@/core/business/services/BusinessUrlService", () => ({
  BusinessUrlService: {
    resolveBySlug: vi.fn(),
    resolveByTerritoryAndSlug: vi.fn(),
  },
}));

vi.mock("@/core/location/repositories/createLocationRepository", () => ({
  createLocationRepository: vi.fn(),
}));

vi.mock("@/core/territorial", () => ({
  territorialGroupService: {
    isMemberOfGroup: vi.fn(),
  },
}));

vi.mock("../CommunityPublicAliasTerritoryResolver", () => ({
  resolveCommunityPublicAliasTerritory: vi.fn(),
}));

const groupResolved = {
  kind: "group",
  group: {
    id: "group-complexo",
    name: "Complexo do Nordeste de Amaralina",
    slug: "complexo-do-nordeste-de-amaralina",
    status: "active",
    members: [
      {
        id: "loc-nordeste",
        geographic_path: "/br/ba/salvador/nordeste-de-amaralina",
        status: "active",
      },
    ],
  },
} as never;

function mockResolvedAlias({
  resolved = groupResolved,
  alias = "complexo",
  publicTerritoryPath = "/ba/salvador/complexo-do-nordeste-de-amaralina",
}: {
  resolved?: never;
  alias?: string;
  publicTerritoryPath?: string;
} = {}) {
  vi.mocked(resolveCommunityPublicAliasTerritory).mockResolvedValue({
    status: "resolved",
    alias,
    canonicalPath: `/comunidade/${alias}`,
    publicTerritoryPath,
    resolved,
  });
}

describe("CommunityBusinessEntityResolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(createLocationRepository).mockReturnValue({
      findByPath: vi.fn().mockResolvedValue({ id: "loc-nordeste" }),
    } as unknown as ReturnType<typeof createLocationRepository>);

    vi.mocked(territorialGroupService.isMemberOfGroup).mockResolvedValue(true);

    mockResolvedAlias();
  });

  it("resolve empresa de grupo territorial apenas quando pertence ao grupo", async () => {
    vi.mocked(BusinessUrlService.resolveBySlug).mockResolvedValue({
      id: "business-1",
      slug: "tone-cos-loja",
      geographic_path: "/br/ba/salvador/nordeste-de-amaralina",
    });

    await expect(
      resolveBusinessEntityFromCommunityAlias("complexo", "tone-cos-loja"),
    ).resolves.toMatchObject({
      status: "resolved",
      alias: "complexo",
      routeParams: {
        state: "ba",
        city: "salvador",
        district: "nordeste-de-amaralina",
        slug: "tone-cos-loja",
      },
    });

    expect(territorialGroupService.isMemberOfGroup).toHaveBeenCalledWith(
      "loc-nordeste",
      "group-complexo",
    );
  });

  it("resolve empresa atribuida diretamente ao caminho do grupo territorial", async () => {
    vi.mocked(BusinessUrlService.resolveBySlug).mockResolvedValue({
      id: "business-1",
      slug: "tone-cos-loja",
      geographic_path: "/br/ba/salvador/complexo-do-nordeste-de-amaralina",
    });

    await expect(
      resolveBusinessEntityFromCommunityAlias("complexo", "tone-cos-loja"),
    ).resolves.toMatchObject({
      status: "resolved",
      alias: "complexo",
      routeParams: {
        state: "ba",
        city: "salvador",
        district: "complexo-do-nordeste-de-amaralina",
        slug: "tone-cos-loja",
      },
    });

    expect(territorialGroupService.isMemberOfGroup).not.toHaveBeenCalled();
  });

  it("bloqueia empresa de outro bairro quando nao pertence ao grupo territorial", async () => {
    vi.mocked(BusinessUrlService.resolveBySlug).mockResolvedValue({
      id: "business-1",
      slug: "padaria-x",
      geographic_path: "/br/ba/salvador/pituba",
    });
    vi.mocked(createLocationRepository).mockReturnValue({
      findByPath: vi.fn().mockResolvedValue({ id: "loc-pituba" }),
    } as unknown as ReturnType<typeof createLocationRepository>);
    vi.mocked(territorialGroupService.isMemberOfGroup).mockResolvedValue(false);

    await expect(
      resolveBusinessEntityFromCommunityAlias("complexo", "padaria-x"),
    ).resolves.toMatchObject({
      status: "business-not-found",
    });
  });

  it("bloqueia empresa fora da cidade do alias comunitario", async () => {
    vi.mocked(BusinessUrlService.resolveBySlug).mockResolvedValue({
      id: "business-1",
      slug: "loja-recife",
      geographic_path: "/br/pe/recife/boa-viagem",
    });

    await expect(
      resolveBusinessEntityFromCommunityAlias("complexo", "loja-recife"),
    ).resolves.toMatchObject({
      status: "business-not-found",
    });

    expect(territorialGroupService.isMemberOfGroup).not.toHaveBeenCalled();
  });

  it("usa territorio explicito para alias de bairro", async () => {
    mockResolvedAlias({
      alias: "nordeste",
      publicTerritoryPath: "/ba/salvador/nordeste-de-amaralina",
      resolved: {
        kind: "location",
        location: {
          id: "loc-nordeste",
          geographic_path: "/br/ba/salvador/nordeste-de-amaralina",
          status: "active",
        },
      } as never,
    });
    vi.mocked(BusinessUrlService.resolveByTerritoryAndSlug).mockResolvedValue({
      id: "business-1",
      slug: "tone-cos-loja",
      geographic_path: "/br/ba/salvador/nordeste-de-amaralina",
    });

    await expect(
      resolveBusinessEntityFromCommunityAlias("nordeste", "tone-cos-loja"),
    ).resolves.toMatchObject({
      status: "resolved",
      routeParams: {
        state: "ba",
        city: "salvador",
        district: "nordeste-de-amaralina",
        slug: "tone-cos-loja",
      },
    });

    expect(BusinessUrlService.resolveByTerritoryAndSlug).toHaveBeenCalledWith(
      "ba",
      "salvador",
      "nordeste-de-amaralina",
      "tone-cos-loja",
    );
  });
});
