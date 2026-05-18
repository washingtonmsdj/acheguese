import { useState } from "react";
import {
  CommunityService,
  InteractionType,
} from "@/core/community/services/CommunityService";
import { useSessionContext } from "@/core/session";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
import type { FlexibleMetadata } from "@/shared/types/supabase.types";

/**
 * Hook para registrar interações comunitárias
 *
 * Uso:
 * const { recordInteraction, recording } = useCommunityInteractions();
 *
 * await recordInteraction("post_created", "post", postId);
 */
export function useCommunityInteractions() {
  const { user, activeProfile } = useSessionContext();
  const [recording, setRecording] = useState(false);

  /**
   * Registra uma interação
   */
  async function recordInteraction(
    interactionType: InteractionType,
    targetType?: string,
    targetId?: string,
    metadata?: FlexibleMetadata,
    options?: {
      showToast?: boolean;
      showBadgeNotification?: boolean;
    },
  ) {
    if (!user || !activeProfile) {
      logger.warn("No authenticated user or active profile");
      return { success: false, error: "No authenticated user" };
    }

    try {
      setRecording(true);

      const result = await CommunityService.recordInteraction(
        user.id,
        interactionType,
        targetType,
        targetId,
        metadata,
      );

      if (result.success) {
        if (options?.showToast && result.points) {
          toast.success(`+${result.points} pontos!`, {
            description: getInteractionMessage(interactionType),
          });
        }

        if (options?.showBadgeNotification) {
          // Reservado para notificação de badge em atualização futura.
        }
      }

      return result;
    } catch (error: unknown) {
      logger.error("Error recording interaction:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erro ao registrar interacao" };
    } finally {
      setRecording(false);
    }
  }

  /**
   * Registra múltiplas interações de uma vez
   */
  async function recordBulkInteractions(
    interactions: Array<{
      type: InteractionType;
      targetType?: string;
      targetId?: string;
      metadata?: FlexibleMetadata;
    }>,
  ) {
    if (!user || !activeProfile) {
      return { success: false, error: "No authenticated user" };
    }

    try {
      setRecording(true);

      const results = await Promise.all(
        interactions.map((interaction) =>
          CommunityService.recordInteraction(
            user.id,
            interaction.type,
            interaction.targetType,
            interaction.targetId,
            interaction.metadata,
          ),
        ),
      );

      const totalPoints = results.reduce((sum, r) => sum + (r.points || 0), 0);

      if (totalPoints > 0) {
        toast.success(`+${totalPoints} pontos!`, {
          description: `${interactions.length} ações registradas`,
        });
      }

      return { success: true, results, totalPoints };
    } catch (error: unknown) {
      logger.error("Error recording bulk interactions:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erro ao registrar interacao" };
    } finally {
      setRecording(false);
    }
  }

  return {
    recordInteraction,
    recordBulkInteractions,
    recording,
  };
}

/**
 * Mensagens amigáveis para cada tipo de interação
 */
function getInteractionMessage(type: InteractionType): string {
  switch (type) {
    case "post_created":
      return "Post criado";
    case "comment_added":
      return "Comentário adicionado";
    case "helpful_vote":
      return "Voto útil";
    case "review_written":
      return "Avaliação escrita";
    case "recommendation_made":
      return "Recomendação feita";
    case "event_attended":
      return "Evento participado";
    case "business_created":
      return "Empresa criada";
    case "service_offered":
      return "Serviço oferecido";
    case "ride_completed":
      return "Corrida completada";
    case "profile_completed":
      return "Perfil completado";
    default:
      return "Ação registrada";
  }
}
