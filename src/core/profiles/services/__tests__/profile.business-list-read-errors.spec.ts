import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserBusinessesByProfilesQuery: vi.fn(),
  getUserBusinessesQuery: vi.fn(),
  trackError: vi.fn(),
}));

vi.mock("../profile.external-data.queries", () => ({
  getUserBusinessesByProfilesQuery: mocks.getUserBusinessesByProfilesQuery,
  getUserBusinessesQuery: mocks.getUserBusinessesQuery,
  getCurrentUserFavoriteBusinessesQuery: vi.fn(),
  searchProfilesByNameQuery: vi.fn(),
}));

vi.mock("@/shared/utils/errorTracking", () => ({
  trackError: mocks.trackError,
}));

import { ProfileService } from "../ProfileService";

describe("Conta: lista de empresas nao mascara falhas de consulta", () => {
  const service = new ProfileService();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("lista individual vazia confirmada permanece vazia", async () => {
    mocks.getUserBusinessesQuery.mockResolvedValueOnce([]);

    await expect(service.getUserBusinesses("profile-1")).resolves.toEqual([]);
    expect(mocks.getUserBusinessesQuery).toHaveBeenCalledWith("profile-1");
    expect(mocks.trackError).not.toHaveBeenCalled();
  });

  it("lista individual devolve empresas reais, sem transformar seus IDs", async () => {
    const businesses = [{ id: "business-2", profile_id: "profile-1" }];
    mocks.getUserBusinessesQuery.mockResolvedValueOnce(businesses);

    await expect(service.getUserBusinesses("profile-1")).resolves.toBe(businesses);
  });

  it("lista individual preserva falha do broker em vez de retornar zero empresas", async () => {
    const failure = new Error("profile-rpc timeout");
    mocks.getUserBusinessesQuery.mockRejectedValueOnce(failure);

    await expect(service.getUserBusinesses("profile-1")).rejects.toBe(failure);
    expect(mocks.trackError).toHaveBeenCalledWith(
      failure,
      expect.objectContaining({
        component: "ProfileService",
        action: "getUserBusinesses",
        metadata: { profileId: "profile-1" },
      }),
    );
  });

  it("lista individual preserva mensagem PostgREST em falha de banco", async () => {
    const failure = { code: "504", message: "business_data unavailable" };
    mocks.getUserBusinessesQuery.mockRejectedValueOnce(failure);

    await expect(service.getUserBusinesses("profile-1")).rejects.toBe(failure);
    expect(mocks.trackError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "business_data unavailable" }),
      expect.objectContaining({ action: "getUserBusinesses" }),
    );
  });

  it("lista vazia confirmada permanece lista vazia", async () => {
    mocks.getUserBusinessesByProfilesQuery.mockResolvedValueOnce([]);

    await expect(service.getUserBusinessesByProfiles(["profile-1"])).resolves.toEqual([]);

    expect(mocks.getUserBusinessesByProfilesQuery).toHaveBeenCalledWith(["profile-1"]);
    expect(mocks.trackError).not.toHaveBeenCalled();
  });

  it("resultado real retorna sem mudar IDs das empresas", async () => {
    const businesses = [{ id: "business-1", profile_id: "profile-1" }];
    mocks.getUserBusinessesByProfilesQuery.mockResolvedValueOnce(businesses);

    await expect(service.getUserBusinessesByProfiles(["profile-1"])).resolves.toBe(businesses);
  });

  it("falha no broker preserva o erro original e nao vira nenhuma empresa", async () => {
    const failure = new Error("business profile broker unavailable");
    mocks.getUserBusinessesByProfilesQuery.mockRejectedValueOnce(failure);

    await expect(service.getUserBusinessesByProfiles(["profile-1"])).rejects.toBe(failure);

    expect(mocks.trackError).toHaveBeenCalledWith(
      failure,
      expect.objectContaining({
        component: "ProfileService",
        action: "getUserBusinessesByProfiles",
      }),
    );
  });

  it("erro PostgREST continua rejeicao e preserva mensagem diagnostica", async () => {
    const failure = { code: "504", message: "business_data timeout" };
    mocks.getUserBusinessesByProfilesQuery.mockRejectedValueOnce(failure);

    await expect(service.getUserBusinessesByProfiles(["profile-1"])).rejects.toBe(failure);

    expect(mocks.trackError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "business_data timeout" }),
      expect.objectContaining({
        component: "ProfileService",
        action: "getUserBusinessesByProfiles",
      }),
    );
  });
});
