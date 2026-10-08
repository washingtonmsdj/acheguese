import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAccessibleProfiles: vi.fn(),
  getCurrentUser: vi.fn(),
  trackError: vi.fn(),
}));

vi.mock("../ProfileRpcService", () => ({
  ProfileRpcService: { getAccessibleProfiles: mocks.getAccessibleProfiles },
}));

vi.mock("@/core/session/services/SessionService", () => ({
  SessionService: { getCurrentUser: mocks.getCurrentUser },
}));

vi.mock("@/shared/utils/errorTracking", () => ({
  trackError: mocks.trackError,
}));

import { getActiveProfile, getProfilesByUserId } from "../profile.queries";

describe("Profile broker: vazio comprovado vs indisponibilidade", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("sem sessao confirmada nao faz chamada ao broker", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    await expect(getProfilesByUserId()).resolves.toEqual([]);

    expect(mocks.getAccessibleProfiles).not.toHaveBeenCalled();
  });

  it("preserva lista vazia legitima retornada pelo broker", async () => {
    mocks.getAccessibleProfiles.mockResolvedValue([]);

    await expect(getProfilesByUserId("user-1")).resolves.toEqual([]);

    expect(mocks.getAccessibleProfiles).toHaveBeenCalledWith({
      targetUserId: "user-1",
    });
    expect(mocks.trackError).not.toHaveBeenCalled();
  });

  it("retorna perfis validos sem mudar IDs do owner", async () => {
    const profiles = [{ id: "profile-1", is_active: true }];
    mocks.getAccessibleProfiles.mockResolvedValue(profiles);

    await expect(getProfilesByUserId("user-1")).resolves.toBe(profiles);
    await expect(getActiveProfile("user-1")).resolves.toBe(profiles[0]);
  });

  it("propaga falha de transporte do RPC sem inventar lista vazia", async () => {
    const failure = new Error("profile-rpc unavailable");
    mocks.getAccessibleProfiles.mockRejectedValue(failure);

    await expect(getProfilesByUserId("user-1")).rejects.toBe(failure);
    expect(mocks.trackError).toHaveBeenCalledWith(
      failure,
      expect.objectContaining({
        component: "profile.queries",
        action: "getProfilesByUserId",
      }),
    );
  });

  it("nao confunde erro do RPC com nenhum perfil ativo", async () => {
    const failure = new Error("profile-rpc 504");
    mocks.getAccessibleProfiles.mockRejectedValue(failure);

    await expect(getActiveProfile("user-1")).rejects.toBe(failure);
  });
});
