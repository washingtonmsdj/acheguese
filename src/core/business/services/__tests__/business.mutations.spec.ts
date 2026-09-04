import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateBusinessInput, UpdateBusinessInput } from "@/core/business/types";

const mocks = vi.hoisted(() => ({
  supabaseFrom: vi.fn(),
  getCurrentUser: vi.fn(),
  createProfile: vi.fn(),
  updateProfile: vi.fn(),
  addMember: vi.fn(),
  checkAvailability: vi.fn(),
  canChangeIdentifier: vi.fn(),
  generateUniqueSlug: vi.fn(),
  createAddress: vi.fn(),
  updateAddress: vi.fn(),
  deleteAddress: vi.fn(),
  deleteProfile: vi.fn(),
  setBulkHours: vi.fn(),
  patchOwnedChannels: vi.fn(),
  getVisibleForEntity: vi.fn(),
  buildPatch: vi.fn(),
  businessDataInsert: vi.fn(),
  businessDataSelect: vi.fn(),
  businessDataSingle: vi.fn(),
  businessDataCurrentSelect: vi.fn(),
  businessDataCurrentEq: vi.fn(),
  businessDataMaybeSingle: vi.fn(),
  businessDataUpdate: vi.fn(),
  businessDataUpdateEq: vi.fn(),
  businessDataUpdateSelect: vi.fn(),
  businessDataUpdateSingle: vi.fn(),
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
    canChangeIdentifier: mocks.canChangeIdentifier,
  },
}));

vi.mock("@/core/address/services/AddressService", () => ({
  AddressService: class {
    createAddress = mocks.createAddress;
    updateAddress = mocks.updateAddress;
    deleteAddress = mocks.deleteAddress;
  },
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
    updateProfile: mocks.updateProfile,
    deleteProfile: mocks.deleteProfile,
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
    getVisibleForEntity: mocks.getVisibleForEntity,
    buildPatch: mocks.buildPatch,
  },
}));

vi.mock("@/core/session/services/SessionService", () => ({
  SessionService: {
    getCurrentUser: mocks.getCurrentUser,
  },
}));

import {
  createBusiness,
  deleteBusiness,
  updateBusiness,
} from "../business.mutations";

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
    mocks.deleteProfile.mockResolvedValue(undefined);
    mocks.deleteAddress.mockResolvedValue(undefined);
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
    expect(mocks.deleteProfile).toHaveBeenCalledWith("profile-1");
    expect(mocks.deleteAddress).not.toHaveBeenCalled();
  });

  it("remove endereco novo quando a criacao do profile falha", async () => {
    mocks.createAddress.mockResolvedValue({ id: "address-1" });
    mocks.createProfile.mockRejectedValue(new Error("profile create failed"));

    await expect(
      createBusiness({
        ...businessInput,
        address_street: "Rua Teste",
        address_number: "10",
        postal_code: "40000-000",
      }),
    ).rejects.toThrow("Erro ao criar empresa: profile create failed");

    expect(mocks.deleteProfile).not.toHaveBeenCalled();
    expect(mocks.deleteAddress).toHaveBeenCalledWith("address-1");
  });

  it("compensa profile antes do endereco quando membership falha", async () => {
    mocks.createAddress.mockResolvedValue({ id: "address-2" });
    mocks.addMember.mockResolvedValue({
      success: false,
      error: "membership failed",
    });

    await expect(
      createBusiness({
        ...businessInput,
        address_street: "Rua Teste",
        address_number: "20",
        postal_code: "40000-001",
      }),
    ).rejects.toThrow("Erro ao criar empresa: membership failed");

    expect(mocks.deleteProfile).toHaveBeenCalledWith("profile-1");
    expect(mocks.deleteAddress).toHaveBeenCalledWith("address-2");
    expect(mocks.deleteProfile.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.deleteAddress.mock.invocationCallOrder[0],
    );
  });

  it("preserva o erro original quando a compensacao do profile falha", async () => {
    mocks.deleteProfile.mockRejectedValue(new Error("profile rollback failed"));

    await expect(createBusiness(businessInput)).rejects.toThrow(
      "Erro ao criar empresa: Erro ao criar estatisticas da empresa",
    );
    expect(mocks.deleteProfile).toHaveBeenCalledWith("profile-1");
  });
});

const currentBusiness = {
  id: "business-data-1",
  slug: "empresa-teste",
  metadata: null,
  address_id: "00000000-0000-0000-0000-000000000002",
  location_id: "00000000-0000-0000-0000-000000000001",
  business_name: "Empresa Teste",
  is_verified: false,
};

const updateInputBase: UpdateBusinessInput = {
  name: "Empresa Teste",
  address_street: "Rua Teste",
  address_number: "123",
  postal_code: "01001-000",
};

function expectNoUpdateWriters(): void {
  expect(mocks.createAddress).not.toHaveBeenCalled();
  expect(mocks.updateAddress).not.toHaveBeenCalled();
  expect(mocks.updateProfile).not.toHaveBeenCalled();
  expect(mocks.businessDataUpdate).not.toHaveBeenCalled();
  expect(mocks.setBulkHours).not.toHaveBeenCalled();
  expect(mocks.patchOwnedChannels).not.toHaveBeenCalled();
  expect(mocks.getVisibleForEntity).not.toHaveBeenCalled();
  expect(mocks.buildPatch).not.toHaveBeenCalled();
}

describe("updateBusiness slug preflight", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.canChangeIdentifier.mockResolvedValue({ canChange: true, daysRemaining: 0 });
    mocks.checkAvailability.mockResolvedValue({ status: "available" });
    mocks.updateAddress.mockResolvedValue({ id: currentBusiness.address_id });
    mocks.updateProfile.mockResolvedValue({ id: "profile-1" });
    mocks.buildPatch.mockReturnValue([]);
    mocks.getVisibleForEntity.mockResolvedValue({});

    mocks.businessDataCurrentSelect.mockReturnValue({
      eq: mocks.businessDataCurrentEq,
    });
    mocks.businessDataCurrentEq.mockReturnValue({
      maybeSingle: mocks.businessDataMaybeSingle,
    });
    mocks.businessDataMaybeSingle.mockResolvedValue({
      data: currentBusiness,
      error: null,
    });

    const businessDataUpdateBuilder = {
      eq: mocks.businessDataUpdateEq,
      select: mocks.businessDataUpdateSelect,
      single: mocks.businessDataUpdateSingle,
    };
    mocks.businessDataUpdate.mockReturnValue(businessDataUpdateBuilder);
    mocks.businessDataUpdateEq.mockReturnValue(businessDataUpdateBuilder);
    mocks.businessDataUpdateSelect.mockReturnValue(businessDataUpdateBuilder);
    mocks.businessDataUpdateSingle.mockResolvedValue({
      data: {
        id: "business-data-1",
        profile_id: "profile-1",
        business_name: "Empresa Renomeada",
        category: "servicos",
        slug: "empresa-teste",
        location_id: currentBusiness.location_id,
        profiles: { id: "profile-1", name: "Empresa Renomeada" },
      },
      error: null,
    });

    mocks.supabaseFrom.mockImplementation((table: string) => {
      if (table === "business_data") {
        return {
          select: mocks.businessDataCurrentSelect,
          update: mocks.businessDataUpdate,
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });
  });

  it("rejeita slug inseguro antes de qualquer mutacao persistente", async () => {
    await expect(
      updateBusiness("profile-1", {
        ...updateInputBase,
        slug: "restaurante-central",
      }),
    ).rejects.toThrow(
      "Erro ao atualizar empresa: O link publico esta muito diferente do nome do negocio. Ajuste para manter autenticidade.",
    );

    expect(mocks.canChangeIdentifier).not.toHaveBeenCalled();
    expect(mocks.checkAvailability).not.toHaveBeenCalled();
    expectNoUpdateWriters();
  });

  it("rejeita cooldown de slug antes de qualquer mutacao persistente", async () => {
    mocks.canChangeIdentifier.mockResolvedValue({ canChange: false, daysRemaining: 4 });

    await expect(
      updateBusiness("profile-1", {
        ...updateInputBase,
        slug: "teste-nova",
      }),
    ).rejects.toThrow(
      "Erro ao atualizar empresa: Nao e possivel alterar o slug da empresa agora. Aguarde 4 dia(s).",
    );

    expect(mocks.canChangeIdentifier).toHaveBeenCalledWith({
      entityType: "business",
      entityId: "profile-1",
    });
    expect(mocks.checkAvailability).not.toHaveBeenCalled();
    expectNoUpdateWriters();
  });

  it("rejeita slug indisponivel antes de qualquer mutacao persistente", async () => {
    mocks.checkAvailability.mockResolvedValue({
      status: "unavailable",
      message: "Slug indisponivel",
    });

    await expect(
      updateBusiness("profile-1", {
        ...updateInputBase,
        slug: "teste-nova",
      }),
    ).rejects.toThrow("Erro ao atualizar empresa: Slug indisponivel");

    expect(mocks.canChangeIdentifier).toHaveBeenCalledWith({
      entityType: "business",
      entityId: "profile-1",
    });
    expect(mocks.checkAvailability).toHaveBeenCalledWith({
      identifier: "teste-nova",
      entityType: "business",
      excludeEntityId: "profile-1",
    });
    expectNoUpdateWriters();
  });

  it("remove endereco novo se update falha antes de persistir business_data", async () => {
    mocks.businessDataMaybeSingle.mockResolvedValue({
      data: {
        ...currentBusiness,
        address_id: null,
      },
      error: null,
    });
    mocks.createAddress.mockResolvedValue({ id: "address-update-1" });
    mocks.businessDataUpdateSingle.mockResolvedValue({
      data: null,
      error: { message: "business update failed" },
    });

    await expect(updateBusiness("profile-1", updateInputBase)).rejects.toThrow(
      "Erro ao atualizar empresa: business update failed",
    );

    expect(mocks.createAddress).toHaveBeenCalled();
    expect(mocks.deleteAddress).toHaveBeenCalledWith("address-update-1");
  });

  it("mantem endereco anexado quando etapa idempotente posterior falha", async () => {
    mocks.businessDataMaybeSingle.mockResolvedValue({
      data: {
        ...currentBusiness,
        address_id: null,
      },
      error: null,
    });
    mocks.createAddress.mockResolvedValue({ id: "address-update-2" });
    mocks.businessDataUpdateSingle.mockResolvedValue({
      data: {
        id: "business-data-1",
        profile_id: "profile-1",
        business_name: "Empresa Teste",
        category: "servicos",
        slug: "empresa-teste",
        location_id: currentBusiness.location_id,
        address_id: "address-update-2",
        profiles: { id: "profile-1", name: "Empresa Teste" },
      },
      error: null,
    });
    mocks.setBulkHours.mockResolvedValue({
      data: null,
      error: "hours failed",
    });

    await expect(
      updateBusiness("profile-1", {
        ...updateInputBase,
        horario_funcionamento: {
          segunda: { open: "08:00", close: "18:00" },
        },
      }),
    ).rejects.toThrow("Erro ao atualizar empresa: hours failed");

    expect(mocks.deleteAddress).not.toHaveBeenCalled();
  });

  it("sincroniza rename no profile e business_data sem acionar preflight de slug", async () => {
    const updated = await updateBusiness("profile-1", {
      name: "Empresa Renomeada",
    });

    expect(mocks.updateProfile).toHaveBeenCalledWith("profile-1", {
      name: "Empresa Renomeada",
    });
    expect(mocks.businessDataUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        business_name: "Empresa Renomeada",
      }),
    );
    expect(mocks.canChangeIdentifier).not.toHaveBeenCalled();
    expect(mocks.checkAvailability).not.toHaveBeenCalled();
    expect(updated.name).toBe("Empresa Renomeada");
  });
});


describe("deleteBusiness retry convergence", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.businessDataUpdate.mockReturnValue({
      eq: mocks.businessDataUpdateEq,
    });
    mocks.businessDataUpdateEq.mockResolvedValue({
      data: null,
      error: null,
    });
    mocks.supabaseFrom.mockImplementation((table: string) => {
      if (table === "business_data") {
        return { update: mocks.businessDataUpdate };
      }
      throw new Error(`Unexpected table: ${table}`);
    });
  });

  it("converge ao repetir soft delete quando a desativacao do profile falha", async () => {
    mocks.updateProfile
      .mockRejectedValueOnce(new Error("profile deactivate failed"))
      .mockResolvedValueOnce({ id: "profile-1", is_active: false });

    await expect(deleteBusiness("profile-1")).rejects.toThrow(
      "Erro ao deletar empresa: profile deactivate failed",
    );
    await expect(deleteBusiness("profile-1")).resolves.toBeUndefined();

    expect(mocks.businessDataUpdate).toHaveBeenCalledTimes(2);
    for (const call of mocks.businessDataUpdate.mock.calls) {
      expect(call[0]).toEqual(
        expect.objectContaining({
          status: "deleted",
        }),
      );
    }
    expect(mocks.updateProfile).toHaveBeenCalledTimes(2);
    expect(mocks.updateProfile).toHaveBeenNthCalledWith(1, "profile-1", {
      is_active: false,
    });
    expect(mocks.updateProfile).toHaveBeenNthCalledWith(2, "profile-1", {
      is_active: false,
    });
  });
});
