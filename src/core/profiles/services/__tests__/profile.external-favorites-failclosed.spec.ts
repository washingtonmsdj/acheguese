import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getCurrentUserBusinessFavorites: vi.fn(),
  getAccessibleProfiles: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: { from: mocks.from },
}));

vi.mock("@/core/favorites/services/favorites.queries", () => ({
  getCurrentUserBusinessFavorites: mocks.getCurrentUserBusinessFavorites,
}));

vi.mock("../ProfileRpcService", () => ({
  ProfileRpcService: {
    getAccessibleProfiles: mocks.getAccessibleProfiles,
  },
}));

import { getCurrentUserFavoriteBusinessesQuery } from "../profile.external-data.queries";

describe("Conta: projecao de empresas favoritas", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("retorna lista vazia apenas quando o owner confirmou ausencia de favoritos", async () => {
    mocks.getCurrentUserBusinessFavorites.mockResolvedValue([]);

    await expect(getCurrentUserFavoriteBusinessesQuery()).resolves.toEqual([]);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("preserva a falha de leitura do owner de favoritos", async () => {
    const failure = new Error("favorite RPC unavailable");
    mocks.getCurrentUserBusinessFavorites.mockRejectedValue(failure);

    await expect(getCurrentUserFavoriteBusinessesQuery()).rejects.toBe(failure);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("nao converte erro de consulta empresarial em zero empresas", async () => {
    const failure = new Error("business_data unavailable");
    mocks.getCurrentUserBusinessFavorites.mockResolvedValue(["profile-id"]);
    const eq = vi.fn().mockResolvedValue({ data: null, error: failure });
    const inQuery = vi.fn().mockReturnValue({ eq });
    const select = vi.fn().mockReturnValue({ in: inQuery });
    mocks.from.mockReturnValue({ select });

    await expect(getCurrentUserFavoriteBusinessesQuery()).rejects.toBe(failure);
    expect(mocks.from).toHaveBeenCalledWith("business_data");
    expect(inQuery).toHaveBeenCalledWith("profile_id", ["profile-id"]);
    expect(eq).toHaveBeenCalledWith("status", "active");
  });

  it("preserva lista realmente vazia quando a consulta foi bem-sucedida", async () => {
    mocks.getCurrentUserBusinessFavorites.mockResolvedValue(["profile-id"]);
    const eq = vi.fn().mockResolvedValue({ data: [], error: null });
    const inQuery = vi.fn().mockReturnValue({ eq });
    const select = vi.fn().mockReturnValue({ in: inQuery });
    mocks.from.mockReturnValue({ select });

    await expect(getCurrentUserFavoriteBusinessesQuery()).resolves.toEqual([]);
    expect(mocks.getAccessibleProfiles).not.toHaveBeenCalled();
  });
});
