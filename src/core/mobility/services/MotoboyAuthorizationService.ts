/**
 * MotoboyAuthorizationService
 *
 * SSOT para autorizacao de solicitacao/operacao de motoboy.
 * Componentes e hooks nao devem implementar regra de permissao local.
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { mobilityRolloutService } from "./MobilityRolloutService";
import { EntitlementsService } from "@/core/billing/entitlements";

const supabaseAny = supabase as any;
const MODERATOR_ROLES = ["owner", "admin"] as const;

export type MotoboySourceType =
  | "passenger"
  | "business"
  | "gastronomy"
  | "service";

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

type BusinessContext = {
  profileIds: string[];
  businessDataIds: string[];
};

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values.filter(
        (value): value is string => typeof value === "string" && value.length > 0,
      ),
    ),
  );
}

export class MotoboyAuthorizationService {
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
      const isMobilityActive = await mobilityRolloutService.isMobilityActive(locationId);
      if (!isMobilityActive) {
        return {
          allowed: false,
          reason: "Mobilidade nao esta disponivel nesta localizacao.",
          code: "ROLLOUT_DISABLED",
        };
      }

      const isMotoboyEnabled = await mobilityRolloutService.isMotoboyEnabled(locationId);
      if (!isMotoboyEnabled) {
        return {
          allowed: false,
          reason: "Modo motoboy desativado para esta localizacao.",
          code: "MOTOBOY_DISABLED",
        };
      }

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
            reason: "Tipo de solicitante invalido.",
            code: "NOT_AUTHENTICATED",
          };
      }
    } catch (error) {
      logger.error("MotoboyAuthorizationService.canRequestDelivery", error as Error, params);
      return {
        allowed: false,
        reason: "Erro ao verificar autorizacao.",
        code: "NOT_AUTHENTICATED",
      };
    }
  }

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
          reason: "Perfil de motorista nao encontrado.",
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
          reason: "Motorista nao habilitado para entregas.",
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
          reason: "Entrega nao encontrada.",
          code: "NOT_REQUESTER",
        };
      }

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
        reason: "Erro ao verificar autorizacao de cancelamento.",
        code: "NOT_REQUESTER",
      };
    }
  }

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
        reason: "Usuario nao autenticado.",
        code: "NOT_AUTHENTICATED",
      };
    }

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
        reason: "ID da empresa e obrigatorio para solicitacao de motoboy.",
        code: "ASSOCIATION_NOT_FOUND",
      };
    }

    if (!userId) {
      return {
        allowed: false,
        reason: "Usuario nao autenticado.",
        code: "NOT_AUTHENTICATED",
      };
    }

    const businessContext = await this.resolveBusinessContext(businessId);
    const hasAssociation = await this.checkBusinessAssociation(userId, businessContext);
    if (!hasAssociation) {
      return {
        allowed: false,
        reason: "Usuario nao tem vinculo com esta empresa.",
        code: "ASSOCIATION_NOT_FOUND",
      };
    }

    const effectivePlanTier =
      planTier || (await this.resolvePlanTierByBusinessIds(businessContext.businessDataIds));
    if (effectivePlanTier) {
      const canUse = EntitlementsService.canUseMotoboyNetwork(effectivePlanTier as any);
      if (!canUse) {
        return {
          allowed: false,
          reason: "Plano da empresa nao permite uso da rede de motoboys.",
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
        reason: "ID do estabelecimento e obrigatorio para solicitacao de motoboy.",
        code: "ASSOCIATION_NOT_FOUND",
      };
    }

    if (!userId) {
      return {
        allowed: false,
        reason: "Usuario nao autenticado.",
        code: "NOT_AUTHENTICATED",
      };
    }

    const gastronomyContext = await this.resolveGastronomyContext(gastronomyId);
    const hasAssociation = await this.checkGastronomyAssociation(userId, gastronomyContext);
    if (!hasAssociation) {
      return {
        allowed: false,
        reason: "Usuario nao tem vinculo com este estabelecimento.",
        code: "ASSOCIATION_NOT_FOUND",
      };
    }

    const effectivePlanTier =
      planTier || (await this.resolvePlanTierByBusinessIds(gastronomyContext.businessDataIds));
    if (effectivePlanTier) {
      const canRequest = EntitlementsService.canRequestDelivery(effectivePlanTier as any);
      if (!canRequest) {
        return {
          allowed: false,
          reason: "Plano do estabelecimento nao permite solicitacao de entregas.",
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
        reason: "ID do servico e usuario sao obrigatorios.",
        code: "ASSOCIATION_NOT_FOUND",
      };
    }

    const hasAssociation = await this.checkServiceAssociation(userId, serviceId);
    if (!hasAssociation) {
      return {
        allowed: false,
        reason: "Usuario nao tem vinculo com este servico.",
        code: "ASSOCIATION_NOT_FOUND",
      };
    }

    return { allowed: true };
  }

  private static async resolveBusinessContext(sourceId: string): Promise<BusinessContext> {
    const profileIds = new Set<string>([sourceId]);
    const businessDataIds = new Set<string>();

    const { data: businessById, error: businessByIdError } = await supabaseAny
      .from("business_data")
      .select("id, profile_id")
      .eq("id", sourceId)
      .maybeSingle();
    if (businessByIdError) {
      logger.warn("MotoboyAuthorizationService.resolveBusinessContext.businessById", {
        sourceId,
        error: businessByIdError,
      });
    }
    if (businessById) {
      businessDataIds.add(businessById.id);
      if (businessById.profile_id) profileIds.add(businessById.profile_id);
    }

    const { data: businessByProfileId, error: businessByProfileError } = await supabaseAny
      .from("business_data")
      .select("id, profile_id")
      .eq("profile_id", sourceId)
      .maybeSingle();
    if (businessByProfileError) {
      logger.warn("MotoboyAuthorizationService.resolveBusinessContext.businessByProfileId", {
        sourceId,
        error: businessByProfileError,
      });
    }
    if (businessByProfileId) {
      businessDataIds.add(businessByProfileId.id);
      if (businessByProfileId.profile_id) profileIds.add(businessByProfileId.profile_id);
    }

    const { data: gastronomyById, error: gastronomyByIdError } = await supabaseAny
      .from("gastronomy_profiles")
      .select("business_id")
      .eq("id", sourceId)
      .maybeSingle();
    if (gastronomyByIdError) {
      logger.warn("MotoboyAuthorizationService.resolveBusinessContext.gastronomyById", {
        sourceId,
        error: gastronomyByIdError,
      });
    }
    if (gastronomyById?.business_id) {
      businessDataIds.add(gastronomyById.business_id);
    }

    if (businessDataIds.size > 0) {
      const { data: canonicalBusinessRows, error: canonicalBusinessRowsError } =
        await supabaseAny
          .from("business_data")
          .select("id, profile_id")
          .in("id", Array.from(businessDataIds));
      if (canonicalBusinessRowsError) {
        logger.warn("MotoboyAuthorizationService.resolveBusinessContext.canonicalBusinessRows", {
          sourceId,
          error: canonicalBusinessRowsError,
        });
      } else {
        for (const row of (canonicalBusinessRows || []) as Array<{ id: string; profile_id?: string | null }>) {
          businessDataIds.add(row.id);
          if (row.profile_id) profileIds.add(row.profile_id);
        }
      }
    }

    return {
      profileIds: uniqueStrings(Array.from(profileIds)),
      businessDataIds: uniqueStrings(Array.from(businessDataIds)),
    };
  }

  private static async resolveGastronomyContext(sourceId: string): Promise<BusinessContext> {
    const businessContext = await this.resolveBusinessContext(sourceId);
    const businessDataIds = new Set<string>(businessContext.businessDataIds);

    const { data: gastronomyByBusiness, error: gastronomyByBusinessError } = await supabaseAny
      .from("gastronomy_profiles")
      .select("business_id")
      .eq("business_id", sourceId)
      .maybeSingle();
    if (gastronomyByBusinessError) {
      logger.warn("MotoboyAuthorizationService.resolveGastronomyContext.gastronomyByBusiness", {
        sourceId,
        error: gastronomyByBusinessError,
      });
    }
    if (gastronomyByBusiness?.business_id) {
      businessDataIds.add(gastronomyByBusiness.business_id);
    }

    if (businessDataIds.size === 0) {
      return {
        profileIds: businessContext.profileIds,
        businessDataIds: [],
      };
    }

    const candidateBusinessIds = Array.from(businessDataIds);
    const { data: gastronomyRows, error: gastronomyRowsError } = await supabaseAny
      .from("gastronomy_profiles")
      .select("business_id")
      .in("business_id", candidateBusinessIds);
    if (gastronomyRowsError) {
      logger.warn("MotoboyAuthorizationService.resolveGastronomyContext.gastronomyRows", {
        sourceId,
        candidateBusinessIds,
        error: gastronomyRowsError,
      });
      return {
        profileIds: businessContext.profileIds,
        businessDataIds: [],
      };
    }

    const gastronomicBusinessIds = uniqueStrings(
      ((gastronomyRows || []) as Array<{ business_id?: string | null }>).map(
        (row) => row.business_id,
      ),
    );
    if (gastronomicBusinessIds.length === 0) {
      return {
        profileIds: businessContext.profileIds,
        businessDataIds: [],
      };
    }

    const { data: businessRows, error: businessRowsError } = await supabaseAny
      .from("business_data")
      .select("id, profile_id")
      .in("id", gastronomicBusinessIds);
    if (businessRowsError) {
      logger.warn("MotoboyAuthorizationService.resolveGastronomyContext.businessRows", {
        sourceId,
        gastronomicBusinessIds,
        error: businessRowsError,
      });
      return {
        profileIds: businessContext.profileIds,
        businessDataIds: gastronomicBusinessIds,
      };
    }

    const profileIds = new Set<string>(businessContext.profileIds);
    for (const row of (businessRows || []) as Array<{ profile_id?: string | null }>) {
      if (row.profile_id) profileIds.add(row.profile_id);
    }

    return {
      profileIds: uniqueStrings(Array.from(profileIds)),
      businessDataIds: gastronomicBusinessIds,
    };
  }

  private static async hasProfileAccess(
    userId: string,
    profileIds: string[],
  ): Promise<boolean> {
    if (profileIds.length === 0) {
      return false;
    }

    try {
      const { data: structuralOwnership, error: structuralError } = await supabaseAny
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .in("id", profileIds)
        .limit(1)
        .maybeSingle();
      if (structuralError) {
        logger.warn("MotoboyAuthorizationService.hasProfileAccess.structural", {
          userId,
          profileIds,
          error: structuralError,
        });
      }
      if (structuralOwnership) {
        return true;
      }

      const { data: membership, error: membershipError } = await supabaseAny
        .from("profile_members")
        .select("profile_id")
        .eq("user_id", userId)
        .in("profile_id", profileIds)
        .in("role", [...MODERATOR_ROLES])
        .limit(1)
        .maybeSingle();
      if (membershipError) {
        logger.warn("MotoboyAuthorizationService.hasProfileAccess.membership", {
          userId,
          profileIds,
          error: membershipError,
        });
        return false;
      }

      return !!membership;
    } catch (error) {
      logger.error("MotoboyAuthorizationService.hasProfileAccess", error as Error, {
        userId,
        profileIds,
      });
      return false;
    }
  }

  private static async checkBusinessAssociation(
    userId: string,
    businessContext: BusinessContext,
  ): Promise<boolean> {
    return this.hasProfileAccess(userId, uniqueStrings(businessContext.profileIds));
  }

  private static async checkGastronomyAssociation(
    userId: string,
    gastronomyContext: BusinessContext,
  ): Promise<boolean> {
    if (gastronomyContext.businessDataIds.length === 0) {
      return false;
    }
    return this.hasProfileAccess(userId, uniqueStrings(gastronomyContext.profileIds));
  }

  private static async resolvePlanTierByBusinessIds(
    businessIds: string[],
  ): Promise<string | undefined> {
    if (businessIds.length === 0) {
      return undefined;
    }

    const { data: currentSubscription, error: currentSubscriptionError } = await supabaseAny
      .from("business_subscriptions")
      .select("plan_tier")
      .in("business_id", businessIds)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (currentSubscriptionError) {
      logger.warn("MotoboyAuthorizationService.resolvePlanTierByBusinessIds.business_subscriptions", {
        businessIds,
        error: currentSubscriptionError,
      });
    } else if (currentSubscription?.plan_tier) {
      return currentSubscription.plan_tier;
    }

    const { data: legacySubscription, error: legacySubscriptionError } = await supabaseAny
      .from("gastronomy_subscriptions")
      .select("plan_tier")
      .in("business_id", businessIds)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (legacySubscriptionError) {
      logger.warn("MotoboyAuthorizationService.resolvePlanTierByBusinessIds.gastronomy_subscriptions", {
        businessIds,
        error: legacySubscriptionError,
      });
      return undefined;
    }

    return legacySubscription?.plan_tier;
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
