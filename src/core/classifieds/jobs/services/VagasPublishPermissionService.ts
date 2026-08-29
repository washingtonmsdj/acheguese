import { AuthService } from "@/core/auth/services/AuthService";
import { ProfileMembersService } from "@/core/profiles/services/multi-profile/profileMembersService";
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";

export type VagaPublishDeniedReason =
  | "NOT_AUTHENTICATED"
  | "NO_ACTIVE_PROFILE"
  | "NO_ACTIVE_LOCATION"
  | "PROFILE_NOT_BUSINESS"
  | "INSUFFICIENT_PROFILE_ROLE"
  | "BUSINESS_NOT_FOUND"
  | "BUSINESS_INACTIVE"
  | "BUSINESS_POSTING_DISABLED"
  | "UNKNOWN";

export interface VagaPublishPermission {
  canPublish: boolean;
  isAdmin: boolean;
  reason?: VagaPublishDeniedReason;
  message: string;
  activeProfileId?: string;
  businessId?: string;
  businessName?: string;
}

interface EvaluatePublishPermissionInput {
  userId: string | null | undefined;
  activeProfileId: string | null | undefined;  activeLocationId?: string | null;
}

const DENIED_MESSAGES: Record<VagaPublishDeniedReason, string> = {
  NOT_AUTHENTICATED: "Faça login para publicar vagas.",
  NO_ACTIVE_PROFILE: "Selecione um perfil ativo para publicar vagas.",
  NO_ACTIVE_LOCATION: "Selecione um território ativo para publicar vagas.",
  PROFILE_NOT_BUSINESS:
    "Somente perfis do tipo empresa podem publicar vagas.",
  INSUFFICIENT_PROFILE_ROLE:
    "Você precisa ser owner/admin do perfil para publicar vagas.",
  BUSINESS_NOT_FOUND:
    "Complete o cadastro da empresa antes de publicar vagas.",
  BUSINESS_INACTIVE:
    "A empresa precisa estar ativa para publicar vagas.",
  BUSINESS_POSTING_DISABLED:
    "A publicação de vagas foi desativada para esta empresa. Contate o administrador.",
  UNKNOWN: "Não foi possível validar as permissões para publicar vagas.",
};

function getDeniedMessageByReason(reason: VagaPublishDeniedReason): string {
  switch (reason) {
    case "NOT_AUTHENTICATED":
      return DENIED_MESSAGES.NOT_AUTHENTICATED;
    case "NO_ACTIVE_PROFILE":
      return DENIED_MESSAGES.NO_ACTIVE_PROFILE;
    case "NO_ACTIVE_LOCATION":
      return DENIED_MESSAGES.NO_ACTIVE_LOCATION;
    case "PROFILE_NOT_BUSINESS":
      return DENIED_MESSAGES.PROFILE_NOT_BUSINESS;
    case "INSUFFICIENT_PROFILE_ROLE":
      return DENIED_MESSAGES.INSUFFICIENT_PROFILE_ROLE;
    case "BUSINESS_NOT_FOUND":
      return DENIED_MESSAGES.BUSINESS_NOT_FOUND;
    case "BUSINESS_INACTIVE":
      return DENIED_MESSAGES.BUSINESS_INACTIVE;
    case "BUSINESS_POSTING_DISABLED":
      return DENIED_MESSAGES.BUSINESS_POSTING_DISABLED;
    case "UNKNOWN":
      return DENIED_MESSAGES.UNKNOWN;
    default:
      return DENIED_MESSAGES.UNKNOWN;
  }
}

export class VagasPublishPermissionService {
  static async evaluate(
    input: EvaluatePublishPermissionInput,
  ): Promise<VagaPublishPermission> {
    const userId = input.userId ?? null;
    const activeProfileId = input.activeProfileId ?? null;
    const activeLocationId = input.activeLocationId ?? null;

    if (!userId) {
      return this.denied("NOT_AUTHENTICATED", false);
    }

    if (!activeProfileId) {
      return this.denied("NO_ACTIVE_PROFILE", false);
    }

    let isAdmin = false;
    try {
      isAdmin = await AuthService.isAdmin(userId);
    } catch (error) {
      logger.warn("[VagasPublishPermissionService] Falha ao verificar admin", {
        userId,
        error,
      });
    }

    if (!activeLocationId) {
      return this.denied("NO_ACTIVE_LOCATION", isAdmin);
    }

    try {
      const profileData = await profileService.getAccessibleProfileById(activeProfileId);

      if (!profileData) {
        logger.error(`[VagasPublishPermissionService] Erro ao carregar profile`, { activeProfileId });
        return this.denied("UNKNOWN", isAdmin);
      }

      const profileType = profileData.profile_type ?? null;

      if (!isAdmin && profileType !== "business") {
        return this.denied("PROFILE_NOT_BUSINESS", isAdmin);
      }

      const isStructuralOwner = profileData.user_id === userId;
      let isManager = isStructuralOwner;

      if (!isManager) {
        const memberRoleResult = await ProfileMembersService.getActiveRoleResult(
          activeProfileId,
          userId,
        );

        if (!memberRoleResult.success) {
          logger.error(
            "[VagasPublishPermissionService] Erro ao validar role de membro",
            memberRoleResult.error,
          );
          return this.denied("UNKNOWN", isAdmin);
        }

        isManager =
          memberRoleResult.data === "owner" || memberRoleResult.data === "admin";
      }

      if (!isAdmin && !isManager) {
        return this.denied("INSUFFICIENT_PROFILE_ROLE", isAdmin);
      }

      const { data: businessData, error: businessError } = await supabase
        .from("business_data")
        .select("id, business_name, status, can_post_vagas")
        .eq("profile_id", activeProfileId)
        .maybeSingle();
      const businessDataTyped = businessData as
        | {
            id?: string;
            business_name?: string | null;
            status?: string | null;
            can_post_vagas?: boolean | null;
          }
        | null;

      if (businessError) {
        logger.error(
          "[VagasPublishPermissionService] Erro ao carregar business_data",
          businessError,
        );
        return this.denied("UNKNOWN", isAdmin);
      }

      if (!isAdmin && !businessDataTyped) {
        return this.denied("BUSINESS_NOT_FOUND", isAdmin);
      }

      if (
        !isAdmin &&
        businessDataTyped?.status &&
        businessDataTyped.status !== "active"
      ) {
        return this.denied("BUSINESS_INACTIVE", isAdmin);
      }

      if (!isAdmin && businessDataTyped?.can_post_vagas === false) {
        return this.denied("BUSINESS_POSTING_DISABLED", isAdmin);
      }

      const businessName = businessDataTyped?.business_name ?? undefined;

      return {
        canPublish: true,
        isAdmin,
        message: isAdmin
          ? "Permissão liberada (admin)."
          : "Permissão liberada para publicar vagas.",
        activeProfileId,
        businessId: businessDataTyped?.id ?? undefined,
        businessName,
      };
    } catch (error) {
      logger.error("[VagasPublishPermissionService] Erro inesperado", error);
      return this.denied("UNKNOWN", isAdmin);
    }
  }

  static getDeniedMessage(reason: VagaPublishDeniedReason): string {
    return getDeniedMessageByReason(reason);
  }

  private static denied(
    reason: VagaPublishDeniedReason,
    isAdmin: boolean,
  ): VagaPublishPermission {
    return {
      canPublish: false,
      isAdmin,
      reason,
      message: getDeniedMessageByReason(reason),
    };
  }
}

export const vagasPublishPermissionService = VagasPublishPermissionService;




