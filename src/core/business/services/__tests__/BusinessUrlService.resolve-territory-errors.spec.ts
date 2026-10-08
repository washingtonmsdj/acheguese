import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  in: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: { from: mocks.from },
}));

import { BusinessUrlService } from "../BusinessUrlService";

describe("BusinessUrlService: resolucao territorial com erro distinto de 404", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    const chain = {
      select: mocks.select,
      eq: mocks.eq,
      in: mocks.in,
      maybeSingle: mocks.maybeSingle,
    };
    mocks.from.mockReturnValue(chain);
    mocks.select.mockReturnValue(chain);
    mocks.eq.mockReturnValue(chain);
    mocks.in.mockReturnValue(chain);
  });

  const resolve = () =>
    BusinessUrlService.resolveByTerritoryAndSlug(
      "ba",
      "salvador",
      "pituba",
      "padaria-x",
    );

  it("preserva empresa real encontrada no mesmo territorio", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({
      data: {
        profile_id: "business-1",
        slug: "padaria-x",
        is_premium: false,
        location: { geographic_path: "/br/ba/salvador/pituba" },
      },
      error: null,
    });

    await expect(resolve()).resolves.toEqual({
      id: "business-1",
      slug: "padaria-x",
      is_premium: false,
      geographic_path: "/br/ba/salvador/pituba",
    });

    expect(mocks.from).toHaveBeenCalledWith("public_business_search");
    expect(mocks.eq).toHaveBeenCalledWith("slug", "padaria-x");
    expect(mocks.eq).toHaveBeenCalledWith("status", "active");
    expect(mocks.in).toHaveBeenCalledWith("business_role", ["standalone", "branch"]);
  });

  it("consulta valida sem empresa retorna null", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await expect(resolve()).resolves.toBeNull();
  });

  it("empresa de outro territorio nao pode ser servida pela URL", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({
      data: {
        profile_id: "business-1",
        slug: "padaria-x",
        is_premium: false,
        location: { geographic_path: "/br/ba/salvador/barra" },
      },
      error: null,
    });

    await expect(resolve()).resolves.toBeNull();
  });

  it("erro PostgREST deve rejeitar, nao retornar falso 404", async () => {
    const failure = { code: "PGRST301", message: "session unavailable" };
    mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: failure });

    await expect(resolve()).rejects.toBe(failure);
  });

  it("erro de rede deve ser propagado intacto", async () => {
    const failure = new Error("business search timeout");
    mocks.maybeSingle.mockRejectedValueOnce(failure);

    await expect(resolve()).rejects.toBe(failure);
  });
});
