import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  in: vi.fn(),
  trackError: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: { from: mocks.from },
}));

vi.mock("@/shared/utils/errorTracking", () => ({
  trackError: mocks.trackError,
}));

import {
  getProfilesByIds,
  getProfilesSummary,
  getProfilesSummaryExtended,
} from "../profile.queries";

const readers = [
  { name: "getProfilesByIds", read: getProfilesByIds },
  { name: "getProfilesSummary", read: getProfilesSummary },
  { name: "getProfilesSummaryExtended", read: getProfilesSummaryExtended },
] as const;

describe("Profile: consultas em lote devolvem vazio apenas quando confirmado", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.from.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({ in: mocks.in });
  });

  for (const reader of readers) {
    it(`${reader.name}: lote sem IDs nao consulta banco`, async () => {
      await expect(reader.read([])).resolves.toEqual([]);
      expect(mocks.from).not.toHaveBeenCalled();
    });

    it(`${reader.name}: vazio confirmado mantem []`, async () => {
      mocks.in.mockResolvedValueOnce({ data: [], error: null });

      await expect(reader.read(["profile-1"])).resolves.toEqual([]);
      expect(mocks.from).toHaveBeenCalledWith("public_profiles");
      expect(mocks.in).toHaveBeenCalledWith("id", ["profile-1"]);
      expect(mocks.trackError).not.toHaveBeenCalled();
    });

    it(`${reader.name}: nao repete IDs no filtro do owner`, async () => {
      mocks.in.mockResolvedValueOnce({ data: [], error: null });

      await reader.read(["profile-1", "profile-1", "profile-2"]);

      expect(mocks.in).toHaveBeenCalledWith("id", ["profile-1", "profile-2"]);
    });

    it(`${reader.name}: erro PostgREST propaga sem simular ausencia`, async () => {
      const error = { code: "PGRST301", message: "PostgREST authorization failure" };
      mocks.in.mockResolvedValueOnce({ data: null, error });

      await expect(reader.read(["profile-1"])).rejects.toBe(error);
      expect(mocks.trackError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          component: "profile.queries",
          action: reader.name,
          metadata: { ids: ["profile-1"] },
        }),
      );
    });

    it(`${reader.name}: erro de transporte nao se transforma em lista vazia`, async () => {
      const error = new Error("profile database unavailable");
      mocks.in.mockRejectedValueOnce(error);

      await expect(reader.read(["profile-1"])).rejects.toBe(error);
    });
  }

  it("getProfilesByIds preserva a colecao real do PostgREST", async () => {
    const profiles = [{ id: "profile-1", name: "Perfil Um" }];
    mocks.in.mockResolvedValueOnce({ data: profiles, error: null });

    await expect(getProfilesByIds(["profile-1"])).resolves.toBe(profiles);
  });

  it("getProfilesSummary usa apenas o mapper canonico de resumo", async () => {
    mocks.in.mockResolvedValueOnce({
      data: [{ id: "profile-1", display_name: null, name: "Perfil Um", avatar_url: null, verified: true }],
      error: null,
    });

    await expect(getProfilesSummary(["profile-1"])).resolves.toEqual([
      { id: "profile-1", displayName: "Perfil Um", avatarUrl: null, verified: true },
    ]);
  });

  it("getProfilesSummaryExtended mantem visibilidade publica sem dados privados", async () => {
    mocks.in.mockResolvedValueOnce({
      data: [{
        id: "profile-1",
        display_name: "Perfil Um",
        username: "perfil-um",
        avatar_url: null,
        public_neighborhood: "Barra",
      }],
      error: null,
    });

    await expect(getProfilesSummaryExtended(["profile-1"])).resolves.toEqual([
      {
        id: "profile-1",
        displayName: "Perfil Um",
        username: "perfil-um",
        avatarUrl: null,
        verified: false,
        neighborhood: "Barra",
        whatsapp: null,
      },
    ]);
  });
});
