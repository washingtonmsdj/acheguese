/**
 * MotoboyAuthorizationService
 *
 * SSOT para autorizacao de solicitacao/operacao de motoboy.
 * Componentes e hooks nao devem implementar regra de permissao local.
 * 
 * FASE 6: Migrado para usar EntitlementResolver ao invés de planTier string
 * - Removido parâmetro planTier de canRequestDelivery()
 * - Entitlements resolvidos via EntitlementResolver.resolve()
 * - Zero cálculo de elegibilidade em componentes
 */

import { supabase } from "@/core/infrastructure/supabase";
import { profileService } from "@/core/profiles/services/ProfileService";
import { logger } from "@/shared/utils/logger";
import { mobilityRolloutService } from "./MobilityRolloutService";
import { MobilityService, mobilityService } from "./MobilityService.impl";
import { DriverAvailabilityService } from "./DriverAvailabilityService";

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
  | "USER_SUSPENDED"
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
    userId?: string;
  }): Promise<AuthorizationResult> {
    const { sourceType, sourceId, locationId, userId } = params;
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
          return this.authorizeBusiness(sourceId, effectiveUserId);

        case "gastronomy":
          return this.authorizeGastronomy(sourceId, effectiveUserId);

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

  static async canOperateDelivery(
    driverProfileId: string,
    activeRideId?: string,
  ): Promise<AuthorizationResult> {
    try {
      const [driverData, profile] = await Promise.all([
        mobilityService.getDriverData(driverProfileId),
        profileService.getProfileById(driverProfileId).catch(() => null),
      ]);
      if (!driverData) {
        return {
          allowed: false,
          reason: "Perfil de motorista nao encontrado.",
          code: "PROFILE_NOT_FOUND",
        };
      }

      if (this.isProfileSuspended(profile as Record<string, unknown> | null)) {
        return {
          allowed: false,
          reason: "Motorista suspenso.",
          code: "DRIVER_SUSPENDED",
        };
      }

      if (!driverData.can_do_delivery) {
        return {
          allowed: false,
          reason: "Motorista nao habilitado para entregas.",
          code: "DRIVER_CANNOT_DELIVER",
        };
      }

      const availability = await DriverAvailabilityService.getStatus(driverProfileId);
      if (!availability?.isOnline) {
        return {
          allowed: false,
          reason: "Motorista offline.",
          code: "DRIVER_OFFLINE",
        };
      }

      if (activeRideId && availability.activeRideId !== activeRideId) {
        return {
          allowed: false,
          reason: "Motorista nao esta vinculado operacionalmente a esta entrega.",
          code: "NOT_ASSIGNED_DRIVER",
        };
      }

      if (availability.activeRideMode && availability.activeRideMode !== "motoboy") {
        return {
          allowed: false,
          reason: "Motorista esta vinculado a uma operacao que nao e de entrega.",
          code: "DRIVER_NOT_ELIGIBLE",
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
      const data = await MobilityService.getRideById(rideId) as { passenger_profile_id?: string } | null;
      if (!data) {
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
      const authApi = supabase?.auth;
      if (!authApi || typeof authApi.getUser !== "function") {
        return undefined;
      }

      const result = await authApi.getUser();
      return result?.data?.user?.id ?? undefined;
    } catch {
      return undefined;
    }
  }

  private static isProfileSuspended(profile: Record<string, unknown> | null): boolean {
    const suspended = Boolean(profile?.is_suspended ?? profile?.suspended ?? false);
    if (!suspended) return false;

    const suspendedUntil = typeof profile?.suspended_until === "string" ? profile.suspended_until : null;
    if (!suspendedUntil) return true;

    const until = new Date(suspendedUntil);
    return Number.isNaN(until.getTime()) || until > new Date();
  }

  private static async ensureRequesterNotSuspended(userId: string): Promise<AuthorizationResult | null> {
    const profile =
      (await profileService.getProfileByType(userId, "personal").catch(() => null)) ??
      (await profileService.getActiveProfile(userId).catch(() => null));

    if (!profile) {
      return {
        allowed: false,
        reason: "Perfil do usuario nao encontrado.",
        code: "PROFILE_NOT_FOUND",
      };
    }

    if (this.isProfileSuspended(profile as Record<string, unknown> | null)) {
      return {
        allowed: false,
        reason: "Usuario suspenso.",
        code: "USER_SUSPENDED",
      };
    }

    return null;
  }

  private static async authorizePassenger(userId?: string): Promise<AuthorizationResult> {
    if (!userId) {
      return {
        allowed: false,
        reason: "Usuario nao autenticado.",
        code: "NOT_AUTHENTICATED",
      };
    }

    const suspended = await this.ensureRequesterNotSuspended(userId);
    if (suspended) return suspended;

    return { allowed: true };
  }

  private static async authorizeBusiness(
    businessId?: string,
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

    const suspended = await this.ensureRequesterNotSuspended(userId);
    if (suspended) return suspended;

    const businessContext = await this.resolveBusinessContext(businessId);
    const hasAssociation = await this.checkBusinessAssociation(userId, businessContext);
    if (!hasAssociation) {
      return {
        allowed: false,
        reason: "Usuario nao tem vinculo com esta empresa.",
        code: "ASSOCIATION_NOT_FOUND",
      };
    }

    // Resolver entitlement via SSOT ao invés de planTier string
    const { data: subscription } = await supabaseAny
      .from("user_subscriptions")
      .select("id, status_v2")
      .eq("user_id", userId)
      .in("status_v2", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription) {
      return {
        allowed: false,
        reason: "Nenhuma assinatura ativa encontrada.",
        code: "PLAN_NOT_ALLOWED",
      };
    }

    // Importar EntitlementResolver dinamicamente para evitar ciclo
    const { EntitlementResolver } = await import("@/core/billing/services/EntitlementResolver");
    
    const entitlements = await EntitlementResolver.resolve({
      user_id: userId,
      business_id: businessId,
      subscription_scope: "business",
    });

    if (!entitlements.canUseMotoboyNetwork) {
      return {
        allowed: false,
        reason: "Plano da empresa nao permite uso da rede de motoboys.",
        code: "PLAN_NOT_ALLOWED",
      };
    }

    return { allowed: true };
  }

  private static async authorizeGastronomy(
    gastronomyId?: string,
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

    const suspended = await this.ensureRequesterNotSuspended(userId);
    if (suspended) return suspended;

    const gastronomyContext = await this.resolveGastronomyContext(gastronomyId);
    const hasAssociation = await this.checkGastronomyAssociation(userId, gastronomyContext);
    if (!hasAssociation) {
      return {
        allowed: false,
        reason: "Usuario nao tem vinculo com este estabelecimento.",
        code: "ASSOCIATION_NOT_FOUND",
      };
    }

    // Resolver entitlement via SSOT ao invés de planTier string
    const { data: subscription } = await supabaseAny
      .from("user_subscriptions")
      .select("id, status_v2")
      .eq("user_id", userId)
      .in("status_v2", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription) {
      return {
        allowed: false,
        reason: "Nenhuma assinatura ativa encontrada.",
        code: "PLAN_NOT_ALLOWED",
      };
    }

    // Importar EntitlementResolver dinamicamente para evitar ciclo
    const { EntitlementResolver } = await import("@/core/billing/services/EntitlementResolver");
    
    const entitlements = await EntitlementResolver.resolve({
      user_id: userId,
      business_id: gastronomyContext.businessDataIds[0],
      subscription_scope: "business",
    });

    if (!entitlements.canRequestDelivery) {
      return {
        allowed: false,
        reason: "Plano do estabelecimento nao permite solicitacao de entregas.",
        code: "PLAN_NOT_ALLOWED",
      };
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

    const suspended = await this.ensureRequesterNotSuspended(userId);
    if (suspended) return suspended;

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
      const ownedProfiles = await profileService.getProfilesByUserId(userId);
      if (ownedProfiles.some((profile) => profileIds.includes(profile.id))) {
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

    return undefined;
  }

  private static async checkServiceAssociation(
    userId: string,
    serviceId: string,
  ): Promise<boolean> {
    try {
      const profiles = await profileService.getProfilesByUserId(userId);
      return profiles.some((profile) => profile.id === serviceId);
    } catch {
      return false;
    }
  }
}
