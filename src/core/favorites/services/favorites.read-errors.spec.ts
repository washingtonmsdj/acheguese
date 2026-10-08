import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolveBusinessDataIdFromProfile: vi.fn(),
  resolveBusinessProfileIdsByDataIds: vi.fn(),
  isFavorited: vi.fn(),
  list: vi.fn(),
  logError: vi.fn(),
  trackError: vi.fn(),
}));

vi.mock("./BusinessFavoriteStore", () => ({
  BusinessFavoriteStore: {
    isFavorited: mocks.isFavorited,
    list: mocks.list,
  },
}));

vi.mock("./businessFavoriteAdapters", () => ({
  resolveBusinessDataIdFromProfile: mocks.resolveBusinessDataIdFromProfile,
  resolveBusinessProfileIdsByDataIds: mocks.resolveBusinessProfileIdsByDataIds,
}));

vi.mock("@/shared/utils/logger", () => ({
  logger: { error: mocks.logError },
}));

vi.mock("@/shared/utils/errorTracking", () => ({
  trackError: mocks.trackError,
}));

import {
  getCurrentUserBusinessFavorites,
  isBusinessFavorited,
} from "./favorites.queries";

describe("Favorites read model: erro nao e ausencia de dados", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("retorna false se o perfil nao representa uma empresa", async () => {
    mocks.resolveBusinessDataIdFromProfile.mockResolvedValue(null);

    await expect(isBusinessFavorited("profile-inexistente")).resolves.toBe(false);
    expect(mocks.isFavorited).not.toHaveBeenCalled();
  });

  it("retorna false quando o RPC comprova que a empresa nao esta favoritada", async () => {
    mocks.resolveBusinessDataIdFromProfile.mockResolvedValue("business-id");
    mocks.isFavorited.mockResolvedValue(false);

    await expect(isBusinessFavorited("profile-id")).resolves.toBe(false);
  });

  it("rejeita quando a resolucao do perfil ou o RPC falha", async () => {
    const failure = new Error("read unavailable");
    mocks.resolveBusinessDataIdFromProfile.mockRejectedValueOnce(failure);

    await expect(isBusinessFavorited("profile-id")).rejects.toBe(failure);

    mocks.resolveBusinessDataIdFromProfile.mockResolvedValue("business-id");
    mocks.isFavorited.mockRejectedValueOnce(failure);

    await expect(isBusinessFavorited("profile-id")).rejects.toBe(failure);
    expect(mocks.trackError).toHaveBeenCalledTimes(2);
  });

  it("retorna vazio somente quando o store realmente nao encontrou favoritos", async () => {
    mocks.list.mockResolvedValue([]);
    mocks.resolveBusinessProfileIdsByDataIds.mockResolvedValue([]);

    await expect(getCurrentUserBusinessFavorites()).resolves.toEqual([]);
    expect(mocks.resolveBusinessProfileIdsByDataIds).toHaveBeenCalledWith([]);
  });

  it("preserva dados e rejeita falha no store ou na projecao", async () => {
    const failure = new Error("PostgREST unavailable");
    mocks.list.mockResolvedValueOnce([{ business_id: "business-id" }]);
    mocks.resolveBusinessProfileIdsByDataIds.mockResolvedValueOnce(["profile-id"]);

    await expect(getCurrentUserBusinessFavorites()).resolves.toEqual(["profile-id"]);

    mocks.list.mockRejectedValueOnce(failure);
    await expect(getCurrentUserBusinessFavorites()).rejects.toBe(failure);

    mocks.list.mockResolvedValueOnce([{ business_id: "business-id" }]);
    mocks.resolveBusinessProfileIdsByDataIds.mockRejectedValueOnce(failure);
    await expect(getCurrentUserBusinessFavorites()).rejects.toBe(failure);

    expect(mocks.trackError).toHaveBeenCalledTimes(2);
  });
});
