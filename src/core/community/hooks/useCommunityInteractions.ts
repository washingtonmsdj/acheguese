import { useState } from "react";
import {
  CommunityService,
  InteractionType,
} from "@/core/community/services/CommunityService";
import { useSessionContext } from "@/core/session"; // ✅ SSOT Regra 1
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";

/**
 * Hook para registrar interações comunitárias
 *
 * Uso:
 * const { recordInteraction, recording } = useCommunityInteractions();
 *
 * await recordInteraction('post_created', 'post', postId);
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
    metadata?: Record<string, any>,
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

      // ✅ Contrato: CommunityService.recordInteraction(userId, ...) - tabela community_interactions usa user_id
      const result = await CommunityService.recordInteraction(
        user.id,
        interactionType,
        targetType,
        targetId,
        metadata,
      );

      if (result.success) {
        // Mostrar toast de pontos ganhos
        if (options?.showToast && result.points) {
          toast.success(`+${result.points} pontos!`, {
            description: getInteractionMessage(interactionType),
          });
        }

        // Verificar se ganhou algum badge novo
        if (options?.showBadgeNotification) {
          // Aqui você pode adicionar lógica para mostrar notificação de badge
          // Por exemplo, verificar se o número de badges aumentou
        }
      }

      return result;
    } catch (error: any) {
      logger.error("Error recording interaction:", error);
      return { success: false, error: error.message };
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
      metadata?: Record<string, any>;
    }>,
  ) {
    if (!user || !activeProfile)
      return { success: false, error: "No authenticated user" };

    try {
      setRecording(true);

      const results = await Promise.all(
        interactions.map((interaction) =>
          CommunityService.recordInteraction(
            user.id, // ✅ Contrato: community_interactions.user_id é auth user_id
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
    } catch (error: any) {
      logger.error("Error recording bulk interactions:", error);
      return { success: false, error: error.message };
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
  const messages: Record<InteractionType, string> = {
    post_created: "Post criado",
    comment_added: "Comentário adicionado",
    helpful_vote: "Voto útil",
    review_written: "Avaliação escrita",
    recommendation_made: "Recomendação feita",
    event_attended: "Evento participado",
    business_created: "Empresa criada",
    service_offered: "Serviço oferecido",
    ride_completed: "Corrida completada",
    profile_completed: "Perfil completado",
  };

  return messages[type] || "Ação registrada";
}
