import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateBusinessInput } from "@/core/business/types";

const mocks = vi.hoisted(() => ({
  supabaseFrom: vi.fn(),
  getCurrentUser: vi.fn(),
  createProfile: vi.fn(),
  addMember: vi.fn(),
  checkAvailability: vi.fn(),
  generateUniqueSlug: vi.fn(),
  setBulkHours: vi.fn(),
  patchOwnedChannels: vi.fn(),
  buildPatch: vi.fn(),
  businessDataInsert: vi.fn(),
  businessDataSelect: vi.fn(),
  businessDataSingle: vi.fn(),
  businessStatsInsert: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: {
    from: mocks.supabaseFrom,
  },
}));

vi.mock("@/core/analytics/services/PublicViewTrackingService", () => ({
  PublicViewTrackingService: {},
}));

vi.mock("@/core/public-identity", () => ({
  PublicIdentityService: {
    checkAvailability: mocks.checkAvailability,
    canChangeIdentifier: vi.fn(),
  },
}));

vi.mock("@/core/address/services/AddressService", () => ({
  AddressService: class {},
}));

vi.mock("@/core/business/BusinessHoursService", () => ({
  BusinessHoursService: {
    setBulkHours: mocks.setBulkHours,
  },
}));

vi.mock("@/core/business/services/BusinessUrlService", () => ({
  BusinessUrlService: {
    generateUniqueSlug: mocks.generateUniqueSlug,
  },
}));

vi.mock("@/core/profiles/services/ProfileService", () => ({
  profileService: {
    createProfile: mocks.createProfile,
  },
}));

vi.mock("@/core/profiles/services/multi-profile/profileMembersService", () => ({
  ProfileMembersService: {
    addMember: mocks.addMember,
  },
}));

vi.mock("@/core/contact", () => ({
  EntityContactService: {
    patchOwnedChannels: mocks.patchOwnedChannels,
    buildPatch: mocks.buildPatch,
  },
}));

vi.mock("@/core/session/services/SessionService", () => ({
  SessionService: {
    getCurrentUser: mocks.getCurrentUser,
  },
}));

import { createBusiness } from "../business.mutations";

const businessInput: CreateBusinessInput = {
  name: "Empresa Teste",
  description: "Descricao valida para o cadastro da empresa",
  category: "servicos",
  slug: "empresa-teste",
  location_id: "00000000-0000-0000-0000-000000000001",
  email: "contato@empresa.test",
  horario_funcionamento: {
    segunda: {
      open: "08:00",
      close: "18:00",
    },
  },
};

describe("createBusiness", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.checkAvailability.mockResolvedValue({ status: "available" });
    mocks.createProfile.mockResolvedValue({ id: "profile-1" });
    mocks.addMember.mockResolvedValue({ success: true });
    mocks.buildPatch.mockReturnValue([]);

    const businessDataBuilder = {
      select: mocks.businessDataSelect,
      single: mocks.businessDataSingle,
    };
    mocks.businessDataInsert.mockReturnValue(businessDataBuilder);
    mocks.businessDataSelect.mockReturnValue(businessDataBuilder);
    mocks.businessDataSingle.mockResolvedValue({
      data: {
        id: "business-data-1",
        profile_id: "profile-1",
        business_name: "Empresa Teste",
        category: "servicos",
        description: businessInput.description,
        slug: businessInput.slug,
        location_id: businessInput.location_id,
        profiles: { id: "profile-1", name: businessInput.name },
      },
      error: null,
    });
    mocks.businessStatsInsert.mockResolvedValue({
      data: null,
      error: { message: "business_stats insert failed" },
    });

    mocks.supabaseFrom.mockImplementation((table: string) => {
      if (table === "business_data") {
        return { insert: mocks.businessDataInsert };
      }

      if (table === "business_stats") {
        return { insert: mocks.businessStatsInsert };
      }

      throw new Error(`Unexpected table: ${table}`);
    });
  });

  it("rejeita quando business_stats falha e interrompe as etapas posteriores", async () => {
    await expect(createBusiness(businessInput)).rejects.toThrow(
      "Erro ao criar empresa: Erro ao criar estatisticas da empresa",
    );

    expect(mocks.businessStatsInsert).toHaveBeenCalledWith({
      profile_id: "profile-1",
      views_count: 0,
      favorites_count: 0,
      shares_count: 0,
    });
    expect(mocks.setBulkHours).not.toHaveBeenCalled();
    expect(mocks.patchOwnedChannels).not.toHaveBeenCalled();
    expect(mocks.buildPatch).not.toHaveBeenCalled();
  });
});
