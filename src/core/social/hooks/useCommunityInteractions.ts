import { useState } from "react";
import { toast } from "sonner";
import { CommunityService } from "@/core/community/services/CommunityService";
import { useSessionContext } from "@/core/session";
import type { FlexibleMetadata } from "@/shared/types/supabase.types";
import { logger } from "@/shared/utils/logger";

export type InteractionType =
  | "post_created"
  | "comment_added"
  | "helpful_vote"
  | "review_written"
  | "recommendation_made"
  | "event_attended"
  | "business_created"
  | "service_offered"
  | "ride_completed"
  | "profile_completed";

async function recordCommunityInteraction(
  userId: string,
  interactionType: InteractionType,
  targetType?: string,
  targetId?: string,
  metadata?: FlexibleMetadata,
): Promise<{
  success: boolean;
  interaction?: CommunityInteraction;
  points?: number;
  error?: string;
}> {
  return CommunityService.recordInteraction(
    userId,
    interactionType,
    targetType,
    targetId,
    metadata,
  );
}

export function useCommunityInteractions() {
  const { user, activeProfile } = useSessionContext();
  const [recording, setRecording] = useState(false);

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
      const result = await recordCommunityInteraction(
        user.id,
        interactionType,
        targetType,
        targetId,
        metadata,
      );

      if (result.success && options?.showToast && result.points) {
        toast.success(`+${result.points} pontos!`, {
          description: getInteractionMessage(interactionType),
        });
      }

      if (result.success && options?.showBadgeNotification) {
        // Reservado para notificacao de badge em atualizacao futura.
      }

      return result;
    } catch (error: any) {
      logger.error("Error recording interaction:", error);
      return { success: false, error: error.message };
    } finally {
      setRecording(false);
    }
  }

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
          recordCommunityInteraction(
            user.id,
            interaction.type,
            interaction.targetType,
            interaction.targetId,
            interaction.metadata,
          ),
        ),
      );
      const totalPoints = results.reduce((sum, result) => sum + (result.points || 0), 0);

      if (totalPoints > 0) {
        toast.success(`+${totalPoints} pontos!`, {
          description: `${interactions.length} acoes registradas`,
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

function getInteractionMessage(type: InteractionType): string {
  switch (type) {
    case "post_created":
      return "Post criado";
    case "comment_added":
      return "Comentario adicionado";
    case "helpful_vote":
      return "Voto util";
    case "review_written":
      return "Avaliacao escrita";
    case "recommendation_made":
      return "Recomendacao feita";
    case "event_attended":
      return "Evento participado";
    case "business_created":
      return "Empresa criada";
    case "service_offered":
      return "Servico oferecido";
    case "ride_completed":
      return "Corrida completada";
    case "profile_completed":
      return "Perfil completado";
    default:
      return "Acao registrada";
  }
}
