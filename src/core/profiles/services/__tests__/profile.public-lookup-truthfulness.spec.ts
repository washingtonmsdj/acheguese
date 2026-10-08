import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
  trackError: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: { from: mocks.from },
}));

vi.mock("@/shared/utils/errorTracking", () => ({
  trackError: mocks.trackError,
}));

import {
  getByUsername,
  getProfileById,
  getPublicProfileById,
} from "../profile.queries";

const publicReads = [
  { name: "getProfileById", read: () => getProfileById("profile-1"), column: "id" },
  { name: "getByUsername", read: () => getByUsername("profile-teste"), column: "username" },
  { name: "getPublicProfileById", read: () => getPublicProfileById("profile-1"), column: "id" },
] as const;

describe("Profile: leitura publica individual com SSOT do PostgREST", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.from.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockReturnValue({ maybeSingle: mocks.maybeSingle });
  });

  for (const { name, read, column } of publicReads) {
    it(`${name} retorna null somente para consulta valida sem registro`, async () => {
      mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

      await expect(read()).resolves.toBeNull();
      expect(mocks.from).toHaveBeenCalledWith("public_profiles");
      expect(mocks.eq).toHaveBeenCalledWith(
        column,
        column === "id" ? "profile-1" : "profile-teste",
      );
      expect(mocks.maybeSingle).toHaveBeenCalledOnce();
      expect(mocks.trackError).not.toHaveBeenCalled();
    });

    it(`${name} preserva dados do owner sem fallback alternativo`, async () => {
      const profile = { id: "profile-1", name: "Perfil Teste" };
      mocks.maybeSingle.mockResolvedValueOnce({ data: profile, error: null });

      await expect(read()).resolves.toBe(profile);
    });

    it(`${name} propaga erro PostgREST sem anunciar perfil ausente`, async () => {
      const failure = { code: "PGRST301", message: "session invalid" };
      mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: failure });

      await expect(read()).rejects.toBe(failure);
      expect(mocks.trackError).toHaveBeenCalledWith(
        failure,
        expect.objectContaining({
          component: "profile.queries",
          action: name,
        }),
      );
    });

    it(`${name} propaga indisponibilidade de rede`, async () => {
      const failure = new Error("PostgREST unavailable");
      mocks.maybeSingle.mockRejectedValueOnce(failure);

      await expect(read()).rejects.toBe(failure);
    });
  }
});
