import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  Business,
  CreateBusinessInput,
  UpdateBusinessInput,
} from "@/core/business/types";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  checkAvailability: vi.fn(),
  canChangeIdentifier: vi.fn(),
  generateUniqueSlug: vi.fn(),
  createAddress: vi.fn(),
  updateAddress: vi.fn(),
  deleteAddress: vi.fn(),
  buildPatch: vi.fn(),
  createBusinessRpc: vi.fn(),
  updateBusinessRpc: vi.fn(),
  deactivateBusinessRpc: vi.fn(),
  getBusinessById: vi.fn(),
}));

vi.mock("@/integrations/supabase", () => ({
  supabase: { from: vi.fn() },
}));

vi.mock("@/core/analytics/services/PublicViewTrackingService", () => ({
  PublicViewTrackingService: { track: vi.fn() },
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

vi.mock("@/core/business/services/BusinessUrlService", () => ({
  BusinessUrlService: {
    generateUniqueSlug: mocks.generateUniqueSlug,
  },
}));

vi.mock("@/core/contact", () => ({
  EntityContactService: {
    buildPatch: mocks.buildPatch,
  },
}));

vi.mock("@/core/session/services/SessionService", () => ({
  SessionService: {
    getCurrentUser: mocks.getCurrentUser,
  },
}));

vi.mock("@/core/profiles/services/ProfileRpcService", () => ({
  ProfileRpcService: {
    createBusiness: mocks.createBusinessRpc,
    updateBusiness: mocks.updateBusinessRpc,
    deactivateBusiness: mocks.deactivateBusinessRpc,
  },
}));

vi.mock("../business.queries", () => ({
  getBusinessById: mocks.getBusinessById,
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
  location_id: "00000000-0000-4000-8000-000000000001",
  email: "contato@empresa.test",
  horario_funcionamento: {
    segunda: {
      open: "08:00",
      close: "18:00",
    },
  },
};

const currentBusiness = {
  id: "profile-1",
  business_data_id: "business-data-1",
  profile_id: "profile-1",
  name: "Empresa Teste",
  description: businessInput.description,
  category: "servicos",
  location_id: businessInput.location_id,
  address_id: null,
  slug: businessInput.slug,
  status: "active",
  is_verified: false,
} as Business;

describe("business lifecycle broker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.checkAvailability.mockResolvedValue({ status: "available" });
    mocks.canChangeIdentifier.mockResolvedValue({
      canChange: true,
      daysRemaining: 0,
    });
    mocks.generateUniqueSlug.mockResolvedValue("empresa-teste");
    mocks.buildPatch.mockImplementation(
      (input: { email?: string; phone?: string; whatsapp?: string }) =>
        input.email
          ? [
              {
                channelType: "email",
                value: input.email,
                visibility: "authenticated",
              },
            ]
          : [],
    );
    mocks.createBusinessRpc.mockResolvedValue({
      success: true,
      data: {
        profile_id: "profile-1",
        business_data_id: "business-data-1",
      },
    });
    mocks.updateBusinessRpc.mockResolvedValue({
      success: true,
      data: {
        profile_id: "profile-1",
        business_data_id: "business-data-1",
      },
    });
    mocks.deactivateBusinessRpc.mockResolvedValue({
      success: true,
      data: {
        profile_id: "profile-1",
        business_data_id: "business-data-1",
        status: "deleted",
      },
    });
    mocks.getBusinessById.mockResolvedValue(currentBusiness);
    mocks.deleteAddress.mockResolvedValue(undefined);
  });

  it("creates Profile, Business, stats, hours and contact through one broker command", async () => {
    const created = await createBusiness(businessInput);

    expect(mocks.createBusinessRpc).toHaveBeenCalledWith({
      businessPatch: expect.objectContaining({
        business_name: "Empresa Teste",
        description: businessInput.description,
        category: "servicos",
        slug: "empresa-teste",
        location_id: businessInput.location_id,
        status: "active",
      }),
      contactChannels: [
        {
          channelType: "email",
          value: "contato@empresa.test",
          visibility: "authenticated",
        },
      ],
      businessHours: [
        {
          day_of_week: 1,
          opens_at: "08:00",
          closes_at: "18:00",
          is_closed: false,
        },
      ],
    });
    expect(mocks.createAddress).not.toHaveBeenCalled();
    expect(mocks.getBusinessById).toHaveBeenCalledWith("profile-1");
    expect(created.profile_id).toBe("profile-1");
  });

  it("creates structured Address with owner_user_id and compensates it if broker rejects", async () => {
    mocks.createAddress.mockResolvedValue({ id: "address-1" });
    mocks.createBusinessRpc.mockResolvedValue({
      success: false,
      error: "business transaction rejected",
    });

    await expect(
      createBusiness({
        ...businessInput,
        address_street: "Rua Teste",
        address_number: "10",
        postal_code: "40000-000",
      }),
    ).rejects.toThrow(
      "Erro ao criar empresa: business transaction rejected",
    );

    expect(mocks.createAddress).toHaveBeenCalledWith(
      expect.objectContaining({
        location_id: businessInput.location_id,
        street: "Rua Teste",
        number: "10",
        owner_user_id: "user-1",
      }),
    );
    expect(mocks.deleteAddress).toHaveBeenCalledWith("address-1");
  });

  it("routes network creation to NetworkService instead of creating a competing structure", async () => {
    await expect(
      createBusiness({
        ...businessInput,
        business_role: "brand_hub",
      }),
    ).rejects.toThrow(
      "Erro ao criar empresa: Brand hubs e filiais devem ser criados pelo NetworkService",
    );

    expect(mocks.createBusinessRpc).not.toHaveBeenCalled();
  });

  it("rejects unsafe slug before Address or broker mutations", async () => {
    await expect(
      updateBusiness("profile-1", {
        name: "Empresa Teste",
        slug: "restaurante-central",
      }),
    ).rejects.toThrow(
      "Erro ao atualizar empresa: O link publico esta muito diferente do nome do negocio. Ajuste para manter autenticidade.",
    );

    expect(mocks.createAddress).not.toHaveBeenCalled();
    expect(mocks.updateAddress).not.toHaveBeenCalled();
    expect(mocks.updateBusinessRpc).not.toHaveBeenCalled();
  });

  it("updates non-structural Business data through the broker and reloads canonical read model", async () => {
    const updatedBusiness = {
      ...currentBusiness,
      name: "Empresa Renomeada",
    } as Business;
    mocks.getBusinessById
      .mockResolvedValueOnce(currentBusiness)
      .mockResolvedValueOnce(updatedBusiness);

    const updated = await updateBusiness("profile-1", {
      name: "Empresa Renomeada",
    });

    expect(mocks.updateBusinessRpc).toHaveBeenCalledWith("profile-1", {
      businessPatch: {
        business_name: "Empresa Renomeada",
      },
      contactChannels: null,
      businessHours: null,
    });
    expect(mocks.updateAddress).not.toHaveBeenCalled();
    expect(updated.name).toBe("Empresa Renomeada");
  });

  it("compensates a newly created Address when an update broker command fails", async () => {
    mocks.createAddress.mockResolvedValue({ id: "address-update-1" });
    mocks.updateBusinessRpc.mockResolvedValue({
      success: false,
      error: "business update rejected",
    });

    await expect(
      updateBusiness("profile-1", {
        location_id: businessInput.location_id,
        address_street: "Rua Nova",
        address_number: "20",
        postal_code: "40000-001",
      }),
    ).rejects.toThrow(
      "Erro ao atualizar empresa: business update rejected",
    );

    expect(mocks.createAddress).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_user_id: "user-1",
        street: "Rua Nova",
      }),
    );
    expect(mocks.deleteAddress).toHaveBeenCalledWith("address-update-1");
  });

  it("rejects structural updates so NetworkService remains the single authority", async () => {
    const input: UpdateBusinessInput = {
      business_role: "standalone",
    };

    await expect(updateBusiness("profile-1", input)).rejects.toThrow(
      "Erro ao atualizar empresa: Campo estrutural business_role pertence ao NetworkService",
    );

    expect(mocks.getBusinessById).not.toHaveBeenCalled();
    expect(mocks.updateBusinessRpc).not.toHaveBeenCalled();
  });

  it("soft-deletes Business and Profile through one broker command", async () => {
    await expect(deleteBusiness("profile-1")).resolves.toBeUndefined();

    expect(mocks.deactivateBusinessRpc).toHaveBeenCalledTimes(1);
    expect(mocks.deactivateBusinessRpc).toHaveBeenCalledWith("profile-1");
  });
});
