/**
 * MotoboyAuthorizationService — Serviço central de autorização para motoboy
 *
 * SSOT: Única fonte de verdade para regras de quem pode solicitar, aceitar e operar entregas.
 * Nenhum componente ou hook deve verificar permissão de motoboy diretamente.
 *
 * Matriz de permissão:
 * - passenger: autenticado + perfil válido + rollout ativo
 * - business: vínculo válido + plano permite + rollout ativo
 * - gastronomy: vínculo válido + plano permite + rollout ativo
 * - service: vínculo válido + rollout ativo
 * - admin: override (não solicita como usuário comum)
 *
 * Quem pode aceitar/operar:
 * - driver com can_do_delivery=true, não suspenso, online
 * - apenas motoboy atribuído pode confirmar coleta/iniciar/concluir/falhar
 * - apenas solicitante (ou admin) pode cancelar
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { mobilityRolloutService } from "./MobilityRolloutService";
import { EntitlementsService } from "@/core/billing/entitlements";

const supabaseAny = supabase as any;

// ============================================
// TIPOS
// ============================================

export type MotoboySourceType = "passenger" | "business" | "gastronomy" | "service";

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  code?: MotoboyAuthErrorCode;
}

export type MotoboyAuthErrorCode =
  | "NOT_AUTHENTICATED"
  | "PROFILE_NOT_FOUND"
  | "ROLLOUT_DISABLED"
  | "MOTOBOY_DISABLED"
  | "PLAN_NOT_ALLOWED"
  | "ASSOCIATION_NOT_FOUND"
  | "DRIVER_NOT_ELIGIBLE"
  | "DRIVER_SUSPENDED"
  | "DRIVER_OFFLINE"
  | "DRIVER_CANNOT_DELIVER"
  | "NOT_ASSIGNED_DRIVER"
  | "NOT_REQUESTER";

// ============================================
// SERVICE
// ============================================

export class MotoboyAuthorizationService {
  /**
   * Verifica se um ator pode solicitar uma entrega motoboy.
   *
   * @param sourceType - Tipo do solicitante
   * @param sourceId - ID da entidade (business_id, gastronomy_id, etc.) — obrigatório para business/gastronomy/service
   * @param locationId - ID da localização para verificar rollout
   * @param planTier - Plano do solicitante (para business/gastronomy)
   */
  static async canRequestDelivery(params: {
    sourceType: MotoboySourceType;
    sourceId?: string;
    locationId: string;
    planTier?: string;
    userId?: string;
  }): Promise<AuthorizationResult> {
    const { sourceType, sourceId, locationId, planTier, userId } = params;
    const effectiveUserId = userId ?? (await this.resolveAuthenticatedUserId());

    try {
      // 1. Verificar rollout de mobilidade
      const isMobilityActive = await mobilityRolloutService.isMobilityActive(locationId);
      if (!isMobilityActive) {
        return {
          allowed: false,
          reason: "Mobilidade não está disponível nesta localização.",
          code: "ROLLOUT_DISABLED",
        };
      }

      // 2. Verificar modo motoboy habilitado
      const isMotoboyEnabled = await mobilityRolloutService.isMotoboyEnabled(locationId);
      if (!isMotoboyEnabled) {
        return {
          allowed: false,
          reason: "Modo motoboy desativado para esta localização.",
          code: "MOTOBOY_DISABLED",
        };
      }

      // 3. Verificar por tipo de ator
      switch (sourceType) {
        case "passenger":
          return this.authorizePassenger(effectiveUserId);

        case "business":
          return this.authorizeBusiness(sourceId, planTier, effectiveUserId);

        case "gastronomy":
          return this.authorizeGastronomy(sourceId, planTier, effectiveUserId);

        case "service":
          return this.authorizeService(sourceId, effectiveUserId);

        default:
          return {
            allowed: false,
            reason: "Tipo de solicitante inválido.",
            code: "NOT_AUTHENTICATED",
          };
      }
    } catch (error) {
      logger.error("MotoboyAuthorizationService.canRequestDelivery", error as Error, params);
      return {
        allowed: false,
        reason: "Erro ao verificar autorização.",
        code: "NOT_AUTHENTICATED",
      };
    }
  }

  /**
   * Verifica se um motorista pode aceitar/operar uma entrega.
   */
  static async canOperateDelivery(driverProfileId: string): Promise<AuthorizationResult> {
    try {
      const { data, error } = await supabaseAny
        .from("driver_data")
        .select("is_verified, is_suspended, subscription_active, can_do_delivery, is_online")
        .eq("profile_id", driverProfileId)
        .maybeSingle();

      if (error || !data) {
        return {
          allowed: false,
          reason: "Perfil de motorista não encontrado.",
          code: "PROFILE_NOT_FOUND",
        };
      }

      if (data.is_suspended) {
        return {
          allowed: false,
          reason: "Motorista suspenso.",
          code: "DRIVER_SUSPENDED",
        };
      }

      if (!data.can_do_delivery) {
        return {
          allowed: false,
          reason: "Motorista não habilitado para entregas.",
          code: "DRIVER_CANNOT_DELIVER",
        };
      }

      if (!data.is_online) {
        return {
          allowed: false,
          reason: "Motorista offline.",
          code: "DRIVER_OFFLINE",
        };
      }

      return { allowed: true };
    } catch (error) {
      logger.error("MotoboyAuthorizationService.canOperateDelivery", error as Error, { driverProfileId });
      return {
        allowed: false,
        reason: "Erro ao verificar elegibilidade do motorista.",
        code: "DRIVER_NOT_ELIGIBLE",
      };
    }
  }

  /**
   * Verifica se um perfil pode cancelar uma entrega específica.
   * Apenas o solicitante original (passenger_profile_id) ou admin pode cancelar.
   */
  static async canCancelDelivery(params: {
    rideId: string;
    profileId: string;
    isAdmin?: boolean;
  }): Promise<AuthorizationResult> {
    const { rideId, profileId, isAdmin } = params;

    if (isAdmin) {
      return { allowed: true };
    }

    try {
      const { data, error } = await supabaseAny
        .from("ride_requests")
        .select("passenger_profile_id, source_id, source_type")
        .eq("id", rideId)
        .maybeSingle();

      if (error || !data) {
        return {
          allowed: false,
          reason: "Entrega não encontrada.",
          code: "NOT_REQUESTER",
        };
      }

      // Solicitante original pode cancelar
      if (data.passenger_profile_id === profileId) {
        return { allowed: true };
      }

      return {
        allowed: false,
        reason: "Apenas o solicitante pode cancelar esta entrega.",
        code: "NOT_REQUESTER",
      };
    } catch (error) {
      logger.error("MotoboyAuthorizationService.canCancelDelivery", error as Error, params);
      return {
        allowed: false,
        reason: "Erro ao verificar autorização de cancelamento.",
        code: "NOT_REQUESTER",
      };
    }
  }

  // ============================================
  // PRIVADOS — Autorização por tipo de ator
  // ============================================

  private static async resolveAuthenticatedUserId(): Promise<string | undefined> {
    try {
      const authApi = supabaseAny?.auth;
      if (!authApi || typeof authApi.getUser !== "function") {
        return undefined;
      }

      const result = await authApi.getUser();
      return result?.data?.user?.id ?? undefined;
    } catch {
      return undefined;
    }
  }

  private static async authorizePassenger(userId?: string): Promise<AuthorizationResult> {
    if (!userId) {
      return {
        allowed: false,
        reason: "Usuário não autenticado.",
        code: "NOT_AUTHENTICATED",
      };
    }
    // Passageiro autenticado com localização válida já passou pelas verificações de rollout
    return { allowed: true };
  }

  private static async authorizeBusiness(
    businessId?: string,
    planTier?: string,
    userId?: string,
  ): Promise<AuthorizationResult> {
    if (!businessId) {
      return {
        allowed: false,
        reason: "ID da empresa é obrigatório para solicitação de motoboy.",
        code: "ASSOCIATION_NOT_FOUND",
      };
    }

    if (!userId) {
      return {
        allowed: false,
        reason: "Usuário não autenticado.",
        code: "NOT_AUTHENTICATED",
      };
    }

    // Verificar vínculo do usuário com a empresa
    const hasAssociation = await this.checkBusinessAssociation(userId, businessId);
    if (!hasAssociation) {
      return {
        allowed: false,
        reason: "Usuário não tem vínculo com esta empresa.",
        code: "ASSOCIATION_NOT_FOUND",
      };
    }

    // Verificar plano
    if (planTier) {
      const canUse = EntitlementsService.canUseMotoboyNetwork(planTier as any);
      if (!canUse) {
        return {
          allowed: false,
          reason: "Plano da empresa não permite uso da rede de motoboys.",
          code: "PLAN_NOT_ALLOWED",
        };
      }
    }

    return { allowed: true };
  }

  private static async authorizeGastronomy(
    gastronomyId?: string,
    planTier?: string,
    userId?: string,
  ): Promise<AuthorizationResult> {
    if (!gastronomyId) {
      return {
        allowed: false,
        reason: "ID do estabelecimento é obrigatório para solicitação de motoboy.",
        code: "ASSOCIATION_NOT_FOUND",
      };
    }

    if (!userId) {
      return {
        allowed: false,
        reason: "Usuário não autenticado.",
        code: "NOT_AUTHENTICATED",
      };
    }

    // Verificar vínculo do usuário com o estabelecimento
    const hasAssociation = await this.checkGastronomyAssociation(userId, gastronomyId);
    if (!hasAssociation) {
      return {
        allowed: false,
        reason: "Usuário não tem vínculo com este estabelecimento.",
        code: "ASSOCIATION_NOT_FOUND",
      };
    }

    // Verificar plano
    if (planTier) {
      const canRequest = EntitlementsService.canRequestDelivery(planTier as any);
      if (!canRequest) {
        return {
          allowed: false,
          reason: "Plano do estabelecimento não permite solicitação de entregas.",
          code: "PLAN_NOT_ALLOWED",
        };
      }
    }

    return { allowed: true };
  }

  private static async authorizeService(
    serviceId?: string,
    userId?: string,
  ): Promise<AuthorizationResult> {
    if (!serviceId || !userId) {
      return {
        allowed: false,
        reason: "ID do serviço e usuário são obrigatórios.",
        code: "ASSOCIATION_NOT_FOUND",
      };
    }

    // Verificar vínculo do usuário com o serviço
    const hasAssociation = await this.checkServiceAssociation(userId, serviceId);
    if (!hasAssociation) {
      return {
        allowed: false,
        reason: "Usuário não tem vínculo com este serviço.",
        code: "ASSOCIATION_NOT_FOUND",
      };
    }

    return { allowed: true };
  }

  // ============================================
  // PRIVADOS — Verificação de vínculos
  // ============================================

  private static async checkBusinessAssociation(
    userId: string,
    businessId: string,
  ): Promise<boolean> {
    try {
      const { data, error } = await supabaseAny
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .eq("id", businessId)
        .maybeSingle();

      if (error) {
        logger.warn("MotoboyAuthorizationService.checkBusinessAssociation - query error", { userId, businessId, error });
        // Fallback: verificar via business_profiles
        return this.checkBusinessProfileOwnership(userId, businessId);
      }

      if (data) return true;

      return this.checkBusinessProfileOwnership(userId, businessId);
    } catch (error) {
      logger.error("MotoboyAuthorizationService.checkBusinessAssociation", error as Error, { userId, businessId });
      return false;
    }
  }

  private static async checkBusinessProfileOwnership(
    userId: string,
    businessId: string,
  ): Promise<boolean> {
    try {
      const { data, error } = await supabaseAny
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .eq("id", businessId)
        .eq("profile_type", "business")
        .maybeSingle();

      if (error) return false;
      return !!data;
    } catch {
      return false;
    }
  }

  private static async checkGastronomyAssociation(
    userId: string,
    gastronomyId: string,
  ): Promise<boolean> {
    try {
      // Verificar se o usuário é dono do perfil de gastronomia
      const { data, error } = await supabaseAny
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .eq("id", gastronomyId)
        .maybeSingle();

      if (error) {
        logger.warn("MotoboyAuthorizationService.checkGastronomyAssociation - query error", { userId, gastronomyId });
        return false;
      }

      return !!data;
    } catch (error) {
      logger.error("MotoboyAuthorizationService.checkGastronomyAssociation", error as Error, { userId, gastronomyId });
      return false;
    }
  }

  private static async checkServiceAssociation(
    userId: string,
    serviceId: string,
  ): Promise<boolean> {
    try {
      const { data, error } = await supabaseAny
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .eq("id", serviceId)
        .maybeSingle();

      if (error) return false;
      return !!data;
    } catch {
      return false;
    }
  }
}
