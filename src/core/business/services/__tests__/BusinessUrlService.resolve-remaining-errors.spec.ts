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

type Lookup = () => Promise<unknown>;
const lookups: Array<[string, Lookup, string]> = [
  ["slug público", () => BusinessUrlService.resolveBySlug("padaria-x"), "public_business_search"],
  ["slug premium", () => BusinessUrlService.resolveByPremiumSlug("padaria-x"), "business_premium_links"],
  ["identificador", () => BusinessUrlService.resolveById("business-1"), "public_business_search"],
];

describe("BusinessUrlService: ausência confirmada versus indisponibilidade", () => {
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

  for (const [name, lookup, table] of lookups) {
    it(`${name}: resultado vazio legítimo continua null`, async () => {
      mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      await expect(lookup()).resolves.toBeNull();
      expect(mocks.from).toHaveBeenCalledWith(table);
    });

    it(`${name}: erro PostgREST não é convertido em 404`, async () => {
      const failure = { code: "PGRST301", message: "backend unavailable" };
      mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: failure });
      await expect(lookup()).rejects.toBe(failure);
      expect(mocks.from).toHaveBeenCalledWith(table);
    });

    it(`${name}: rejeição de transporte preserva o erro original`, async () => {
      const failure = new Error("PostgREST transport failed");
      mocks.maybeSingle.mockRejectedValueOnce(failure);
      await expect(lookup()).rejects.toBe(failure);
    });
  }

  const publicBusiness = {
    profile_id: "business-1",
    slug: "padaria-x",
    is_premium: false,
    location: { geographic_path: "/br/ba/salvador/pituba" },
  };

  it("slug público conserva mapeamento canônico confirmado", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: publicBusiness, error: null });
    await expect(BusinessUrlService.resolveBySlug("padaria-x")).resolves.toEqual({
      id: "business-1",
      slug: "padaria-x",
      is_premium: false,
      geographic_path: "/br/ba/salvador/pituba",
    });
  });

  it("ID conserva filtro de status e função de mapeamento existente", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: publicBusiness, error: null });
    await expect(BusinessUrlService.resolveById("business-1")).resolves.toEqual({
      id: "business-1",
      slug: "padaria-x",
      is_premium: false,
      geographic_path: "/br/ba/salvador/pituba",
    });
    expect(mocks.eq).toHaveBeenCalledWith("profile_id", "business-1");
    expect(mocks.eq).toHaveBeenCalledWith("status", "active");
    expect(mocks.in).toHaveBeenCalledWith("business_role", ["standalone", "branch"]);
  });

  it("premium retorna somente empresa elegível, ativa e com território", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({
      data: {
        slug: "padaria-x",
        business: {
          ...publicBusiness,
          is_premium: true,
          status: "active",
          business_role: "standalone",
        },
      },
      error: null,
    });
    await expect(BusinessUrlService.resolveByPremiumSlug("padaria-x")).resolves.toEqual({
      id: "business-1",
      slug: "padaria-x",
      is_premium: true,
      geographic_path: "/br/ba/salvador/pituba",
    });
  });

  it("premium não autoriza empresa inativa após consulta válida", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({
      data: {
        slug: "padaria-x",
        business: {
          ...publicBusiness,
          is_premium: true,
          status: "inactive",
          business_role: "standalone",
        },
      },
      error: null,
    });
    await expect(BusinessUrlService.resolveByPremiumSlug("padaria-x")).resolves.toBeNull();
  });

  it("premium sem vínculo confirmado não produz slug alternativo", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: { business: null }, error: null });
    await expect(BusinessUrlService.resolveByPremiumSlug("padaria-x")).resolves.toBeNull();
  });
});
