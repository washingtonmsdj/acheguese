import { describe, expect, it, beforeEach, vi } from "vitest";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { createTerritorialGroupRepository } from "@/core/location/repositories/createTerritorialGroupRepository";
import { CommunityPublicAliasService } from "@/core/routing/services/CommunityPublicAliasService";

vi.mock("@/integrations/supabase", () => ({
  supabase: {},
}));

vi.mock("@/core/location/repositories/createLocationRepository", () => ({
  createLocationRepository: vi.fn(),
}));

vi.mock("@/core/location/repositories/createTerritorialGroupRepository", () => ({
  createTerritorialGroupRepository: vi.fn(),
}));

vi.mock("@/core/routing/services/CommunityPublicAliasService", () => ({
  CommunityPublicAliasService: {
    findPublicUrlForTerritory: vi.fn(),
  },
}));

const businessContext = {
  id: "business-1",
  slug: "padaria-x",
  is_premium: false,
  geographic_path: "/br/ba/salvador/pituba",
};

describe("BusinessUrlService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(createLocationRepository).mockReturnValue({
      findByPath: vi.fn().mockResolvedValue({
        id: "loc-pituba",
        geographic_path: "/br/ba/salvador/pituba",
      }),
    } as unknown as ReturnType<typeof createLocationRepository>);

    vi.mocked(createTerritorialGroupRepository).mockReturnValue({
      findGroupsContainingLocation: vi.fn().mockResolvedValue([]),
    } as unknown as ReturnType<typeof createTerritorialGroupRepository>);

    vi.mocked(CommunityPublicAliasService.findPublicUrlForTerritory).mockResolvedValue(
      "/santa-cruz",
    );
  });

  it("usa alias explicito de comunidade sem consultar territorio", async () => {
    await expect(
      BusinessUrlService.findCommunityPublicBaseUrl({
        ...businessContext,
        community_alias: "santa-cruz",
      }),
    ).resolves.toBe("/comunidade/santa-cruz");

    expect(createLocationRepository).not.toHaveBeenCalled();
  });

  it("mantem URL publica canonica mesmo quando ha alias publico no territorio", async () => {
    expect(BusinessUrlService.getPublicCanonicalUrl(businessContext)).toBe(
      "/empresas/ba/salvador/pituba/padaria-x",
    );

    expect(CommunityPublicAliasService.findPublicUrlForTerritory).not.toHaveBeenCalled();
  });

  it("resolve alias de grupo territorial apenas para contexto comunitario explicito", async () => {
    vi.mocked(CommunityPublicAliasService.findPublicUrlForTerritory)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("/complexo-nordeste");

    vi.mocked(createTerritorialGroupRepository).mockReturnValue({
      findGroupsContainingLocation: vi.fn().mockResolvedValue([
        { id: "group-complexo", slug: "complexo-nordeste" },
      ]),
    } as unknown as ReturnType<typeof createTerritorialGroupRepository>);

    await expect(BusinessUrlService.findCommunityPublicBaseUrl(businessContext)).resolves.toBe(
      "/complexo-nordeste",
    );

    expect(CommunityPublicAliasService.findPublicUrlForTerritory).toHaveBeenNthCalledWith(2, {
      kind: "group",
      territoryId: "group-complexo",
    });
  });

  it("mantem fallback territorial quando nao ha alias publico", async () => {
    vi.mocked(CommunityPublicAliasService.findPublicUrlForTerritory).mockResolvedValue(null);

    expect(BusinessUrlService.getCanonicalUrl(businessContext)).toBe(
      "/empresas/ba/salvador/pituba/padaria-x",
    );
  });

  it("gera URL de empresa dentro da comunidade apenas por chamada explicita", () => {
    expect(BusinessUrlService.getCommunityScopedUrl(businessContext, "santa-cruz")).toBe(
      "/comunidade/santa-cruz/empresas/padaria-x",
    );
  });
});
