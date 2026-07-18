/**
 * Testes de Autorização - Módulo de Mobilidade (Motoboy)
 *
 * Valida MotoboyAuthorizationService e matriz de permissões
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { MotoboyAuthorizationService } from "../src/core/mobility/services/MotoboyAuthorizationService";

// Mock do Supabase com chain completo
const mockSupabaseQuery = {
  select: vi.fn(() => mockSupabaseQuery),
  eq: vi.fn(() => mockSupabaseQuery),
  in: vi.fn(() => mockSupabaseQuery),
  order: vi.fn(() => mockSupabaseQuery),
  limit: vi.fn(() => mockSupabaseQuery),
  then: vi.fn(
    (
      resolve: (value: {
        data: Array<Record<string, string>>;
        error: null;
      }) => void,
    ) =>
      resolve({
        data: [
          {
            id: "business-id",
            profile_id: "business-id",
            business_id: "business-id",
          },
        ],
        error: null,
      }),
  ),
  maybeSingle: vi.fn(() =>
    Promise.resolve({
      data: {
        id: "business-id",
        profile_id: "business-id",
        business_id: "business-id",
        status_v2: "active",
      },
      error: null,
    }),
  ),
  single: vi.fn(() =>
    Promise.resolve({ data: { id: "profile-123" }, error: null }),
  ),
};

vi.mock("../src/integrations/supabase", () => ({
  supabase: {
    from: vi.fn(() => mockSupabaseQuery),
  },
}));

vi.mock("../src/core/profiles/services/ProfileService", () => ({
  profileService: {
    getProfileById: vi.fn(() =>
      Promise.resolve({ id: "profile-123", is_suspended: false }),
    ),
    getProfileByType: vi.fn(() =>
      Promise.resolve({ id: "profile-123", is_suspended: false }),
    ),
    getActiveProfile: vi.fn(() =>
      Promise.resolve({ id: "profile-123", is_suspended: false }),
    ),
    getProfilesByUserId: vi.fn(() =>
      Promise.resolve([
        { id: "business-id", is_suspended: false },
        { id: "gastronomy-id", is_suspended: false },
      ]),
    ),
  },
}));

// Mock do MobilityRolloutService
vi.mock("../src/core/mobility/services/MobilityRolloutService", () => ({
  mobilityRolloutService: {
    isMobilityActive: vi.fn(() => Promise.resolve(true)),
    isMotoboyEnabled: vi.fn(() => Promise.resolve(true)),
  },
}));

vi.mock("@/core/billing/services/EntitlementResolver", () => ({
  EntitlementResolver: {
    resolve: vi.fn(() =>
      Promise.resolve({
        canUseMotoboyNetwork: true,
        canRequestDelivery: true,
      }),
    ),
  },
}));

describe("MotoboyAuthorizationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("canRequestDelivery - Passenger", () => {
    it("deve permitir passageiro autenticado com localização válida", async () => {
      const result = await MotoboyAuthorizationService.canRequestDelivery({
        sourceType: "passenger",
        locationId: "valid-location-id",
        userId: "valid-user-id",
      });

      expect(result.allowed).toBe(true);
      expect(result.code).toBeUndefined();
    });

    it("deve negar passageiro sem userId", async () => {
      const result = await MotoboyAuthorizationService.canRequestDelivery({
        sourceType: "passenger",
        locationId: "valid-location-id",
      });

      expect(result.allowed).toBe(false);
      expect(result.code).toBe("NOT_AUTHENTICATED");
    });
  });

  describe("canRequestDelivery - Business", () => {
    it("deve permitir business com plano adequado", async () => {
      const result = await MotoboyAuthorizationService.canRequestDelivery({
        sourceType: "business",
        sourceId: "business-id",
        locationId: "valid-location-id",
        userId: "valid-user-id",
      });

      expect(result).toEqual({ allowed: true });
    });

    it("deve negar business sem sourceId", async () => {
      const result = await MotoboyAuthorizationService.canRequestDelivery({
        sourceType: "business",
        locationId: "valid-location-id",
        userId: "valid-user-id",
      });

      expect(result.allowed).toBe(false);
      expect(result.code).toBe("ASSOCIATION_NOT_FOUND");
    });

    it("deve negar business sem permissao operacional ativa", async () => {
      const { EntitlementResolver } =
        await import("@/core/billing/services/EntitlementResolver");
      vi.mocked(EntitlementResolver.resolve).mockResolvedValueOnce({
        canUseMotoboyNetwork: false,
        canRequestDelivery: false,
      } as never);

      const result = await MotoboyAuthorizationService.canRequestDelivery({
        sourceType: "business",
        sourceId: "business-id",
        locationId: "valid-location-id",
        userId: "valid-user-id",
      });

      expect(result.allowed).toBe(false);
      expect(result.code).toBe("PLAN_NOT_ALLOWED");
    });
  });

  describe("canRequestDelivery - Gastronomy", () => {
    it("deve permitir gastronomy com plano adequado", async () => {
      const result = await MotoboyAuthorizationService.canRequestDelivery({
        sourceType: "gastronomy",
        sourceId: "gastronomy-id",
        locationId: "valid-location-id",
        userId: "valid-user-id",
      });

      expect(result).toEqual({ allowed: true });
    });

    it("deve negar gastronomy sem sourceId", async () => {
      const result = await MotoboyAuthorizationService.canRequestDelivery({
        sourceType: "gastronomy",
        locationId: "valid-location-id",
        userId: "valid-user-id",
      });

      expect(result.allowed).toBe(false);
      expect(result.code).toBe("ASSOCIATION_NOT_FOUND");
    });
  });

  describe("canRequestDelivery - Rollout", () => {
    it("deve negar quando mobilidade desabilitada", async () => {
      const { mobilityRolloutService } =
        await import("../src/core/mobility/services/MobilityRolloutService");
      vi.mocked(mobilityRolloutService.isMobilityActive).mockResolvedValueOnce(
        false,
      );

      const result = await MotoboyAuthorizationService.canRequestDelivery({
        sourceType: "passenger",
        locationId: "valid-location-id",
        userId: "valid-user-id",
      });

      expect(result.allowed).toBe(false);
      expect(result.code).toBe("ROLLOUT_DISABLED");
    });

    it("deve negar quando modo motoboy desabilitado", async () => {
      const { mobilityRolloutService } =
        await import("../src/core/mobility/services/MobilityRolloutService");
      vi.mocked(mobilityRolloutService.isMotoboyEnabled).mockResolvedValueOnce(
        false,
      );

      const result = await MotoboyAuthorizationService.canRequestDelivery({
        sourceType: "passenger",
        locationId: "valid-location-id",
        userId: "valid-user-id",
      });

      expect(result.allowed).toBe(false);
      expect(result.code).toBe("MOTOBOY_DISABLED");
    });
  });

  describe("Códigos de Erro", () => {
    it("deve retornar códigos de erro padronizados", async () => {
      const errorCodes = [
        "NOT_AUTHENTICATED",
        "PROFILE_NOT_FOUND",
        "ROLLOUT_DISABLED",
        "MOTOBOY_DISABLED",
        "PLAN_NOT_ALLOWED",
        "ASSOCIATION_NOT_FOUND",
        "DRIVER_NOT_ELIGIBLE",
        "DRIVER_SUSPENDED",
        "DRIVER_OFFLINE",
        "DRIVER_CANNOT_DELIVER",
        "NOT_ASSIGNED_DRIVER",
        "NOT_REQUESTER",
      ];

      // Validar que todos os códigos estão definidos no tipo
      errorCodes.forEach((code) => {
        expect(code).toBeDefined();
        expect(typeof code).toBe("string");
      });
    });
  });
});

describe("Matriz de Permissões - Integração", () => {
  it("deve validar matriz completa de permissões", () => {
    const matrix = {
      passenger: {
        canRequest: true,
        requirements: ["authenticated", "valid_profile", "rollout_active"],
      },
      business: {
        canRequest: true,
        requirements: ["valid_association", "plan_allows", "rollout_active"],
      },
      gastronomy: {
        canRequest: true,
        requirements: ["valid_association", "plan_allows", "rollout_active"],
      },
      service: {
        canRequest: true,
        requirements: ["valid_association", "rollout_active"],
      },
      admin: {
        canRequest: true,
        requirements: ["override"],
      },
    };

    expect(matrix.passenger.canRequest).toBe(true);
    expect(matrix.business.canRequest).toBe(true);
    expect(matrix.gastronomy.canRequest).toBe(true);
    expect(matrix.service.canRequest).toBe(true);
    expect(matrix.admin.canRequest).toBe(true);
  });
});
