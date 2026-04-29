import { useState } from "react";
import { toast } from "sonner";
import { GamificationService } from "@/core/gamification/services/GamificationService";
import { useSessionContext } from "@/core/session";
import { supabase } from "@/integrations/supabase";
import type { FlexibleMetadata } from "@/shared/types/supabase.types";
import { trackError } from "@/shared/utils/errorTracking";
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

interface CommunityInteraction {
  id: string;
  user_id: string;
  interaction_type: InteractionType;
  target_type?: string;
  target_id?: string;
  points: number;
  metadata?: FlexibleMetadata;
  created_at: string;
}

const INTERACTION_POINTS: Record<InteractionType, number> = {
  post_created: 10,
  comment_added: 5,
  helpful_vote: 2,
  review_written: 15,
  recommendation_made: 8,
  event_attended: 12,
  business_created: 50,
  service_offered: 30,
  ride_completed: 20,
  profile_completed: 25,
};

const BADGE_REQUIREMENTS = {
  first_post: { interaction_type: "post_created", count: 1 },
  active_commenter: { interaction_type: "comment_added", count: 10 },
  helpful_neighbor: { interaction_type: "helpful_vote", count: 25 },
  community_leader: { total_points: 500 },
  super_contributor: { total_interactions: 100 },
} as const;

interface UserStats {
  totalInteractions: number;
  totalPoints: number;
  interactionsByType: Record<string, number>;
}

function getInteractionPoints(interactionType: InteractionType): number {
  return INTERACTION_POINTS[interactionType] ?? 0;
}

async function getUserStats(userId: string): Promise<UserStats> {
  const { data, error } = await (supabase as any)
    .from("community_interactions")
    .select("interaction_type, points")
    .eq("user_id", userId);

  if (error) {
    trackError(error, {
      component: "SocialCommunityInteractions",
      action: "getUserStats",
    });
    return {
      totalInteractions: 0,
      totalPoints: 0,
      interactionsByType: {},
    };
  }

  const interactions = data || [];
  return {
    totalInteractions: interactions.length,
    totalPoints: interactions.reduce((sum: number, row: any) => sum + (row.points || 0), 0),
    interactionsByType: interactions.reduce((acc: Record<string, number>, row: any) => {
      acc[row.interaction_type] = (acc[row.interaction_type] || 0) + 1;
      return acc;
    }, {}),
  };
}

async function awardBadge(userId: string, badgeCode: string) {
  const { data: badge, error } = await (supabase as any)
    .from("community_badges")
    .select("id")
    .eq("code", badgeCode)
    .single();

  if (error || !badge) {
    return;
  }

  await GamificationService.grantAchievement(userId, badgeCode);
}

async function checkAndAwardBadges(userId: string) {
  try {
    const stats = await getUserStats(userId);
    const earnedAchievements = await GamificationService.getUserAchievements(userId);
    const earnedCodes = new Set(earnedAchievements.map((achievement) => achievement.achievement_code));

    for (const [badgeCode, requirement] of Object.entries(BADGE_REQUIREMENTS)) {
      if (earnedCodes.has(badgeCode)) continue;

      let shouldAward = false;
      if ("interaction_type" in requirement) {
        shouldAward = (stats.interactionsByType[requirement.interaction_type] || 0) >= requirement.count;
      } else if ("total_interactions" in requirement) {
        shouldAward = stats.totalInteractions >= requirement.total_interactions;
      } else if ("total_points" in requirement) {
        shouldAward = stats.totalPoints >= requirement.total_points;
      }

      if (shouldAward) {
        await awardBadge(userId, badgeCode);
      }
    }
  } catch (error) {
    trackError(error as Error, {
      component: "SocialCommunityInteractions",
      action: "checkAndAwardBadges",
    });
  }
}

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
  try {
    const points = getInteractionPoints(interactionType);
    const { data: interaction, error } = await (supabase as any)
      .from("community_interactions")
      .insert({
        user_id: userId,
        interaction_type: interactionType,
        target_type: targetType,
        target_id: targetId,
        points,
        metadata,
      })
      .select()
      .single();

    if (error) {
      trackError(error, {
        component: "SocialCommunityInteractions",
        action: "recordCommunityInteraction",
      });
      return { success: false, error: error.message };
    }

    await checkAndAwardBadges(userId);

    return { success: true, interaction, points };
  } catch (error) {
    trackError(error as Error, {
      component: "SocialCommunityInteractions",
      action: "recordCommunityInteraction",
    });
    return { success: false, error: (error as Error).message };
  }
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
