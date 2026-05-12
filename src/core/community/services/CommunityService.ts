/**
 * CommunityService - SSOT para sistema comunitário
 *
 * Responsável por:
 * - Interações comunitárias (community_interactions)
 * - Perfis comunitários (community_profiles)
 * - Badges comunitários (community_badges)
 * - Rankings e leaderboards
 * - Integração com GamificationService para achievements
 *
 * ESCOPO DEFINIDO:
 * - NÃO gerencia likes/saves (SocialInteractionsService)
 * - NÃO gerencia posts/comments (PostService/CommentService)
 * - APENAS gamificação comunitária e badges
 */

import { supabase } from "@/integrations/supabase";
import { GamificationService } from "@/core/gamification/services/GamificationService";
import { trackError } from "@/shared/utils/errorTracking";
import { logger } from "@/shared/utils/logger";
import type { TerritoryFilter } from "@/core/location";

// Helper para verificar erros do Postgres de forma type-safe
interface PostgresError {
  code?: string;
  message: string;
}

function isPostgresError(error: unknown): error is PostgresError {
  return typeof error === "object" && error !== null && "code" in error;
}

function isTableNotFoundError(error: unknown): boolean {
  if (!isPostgresError(error)) return false;
  const code = error.code;
  return code === "PGRST204" || code === "PGRST116" || code === "42P01";
}
import type { FlexibleMetadata } from "@/shared/types/supabase.types";

/**
 * Tipos de interação disponíveis
 */
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

export interface CommunityProfile {
  id: string;
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  neighborhood?: string;
  total_points: number;
  total_interactions: number;
  badges_count: number;
  level: string;
  created_at: string;
  updated_at: string;
}

export interface CommunityInteraction {
  id: string;
  user_id: string;
  interaction_type: InteractionType;
  target_type?: string;
  target_id?: string;
  points: number;
  metadata?: FlexibleMetadata;
  created_at: string;
}

export interface CommunityBadge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface UserBadge extends CommunityBadge {
  earned_at?: string;
  progress: number;
  is_earned: boolean;
}

export interface CommunityStats {
  totalInteractions: number;
  totalPoints: number;
  interactionsByType: Record<string, number>;
}

export interface UserLevel {
  level: string;
  name: string;
  icon: string;
  color: string;
  nextLevel: string;
  nextLevelPoints: number;
  progress: number;
}

export interface EngagementScoreEntry {
  entity_name: string;
  total_score: number;
  rua?: string;
  neighborhood?: string;
  entity_type?: string;
  period_start?: string;
}

interface GroupProfileInfo {
  name: string | null;
  avatar_url: string | null;
}

interface GroupMemberCountRow {
  count: number | null;
}

interface GroupRow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  is_private: boolean | null;
  created_at: string;
  created_by: string | null;
  location_id: string | null;
  profiles?: GroupProfileInfo | null;
  members_count?: GroupMemberCountRow[] | null;
  [key: string]: unknown;
}

type GroupCreateInput = {
  name: string;
  description?: string;
  category?: string;
  is_private?: boolean;
  location_id?: string;
  join_policy?: string;
  posting_policy?: string;
  member_visibility?: string;
  media_policy?: string;
  rules?: string;
};

/**
 * Pontuação por tipo de interação
 */
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

function getInteractionPoints(interactionType: InteractionType): number {
  switch (interactionType) {
    case "post_created":
      return INTERACTION_POINTS.post_created;
    case "comment_added":
      return INTERACTION_POINTS.comment_added;
    case "helpful_vote":
      return INTERACTION_POINTS.helpful_vote;
    case "review_written":
      return INTERACTION_POINTS.review_written;
    case "recommendation_made":
      return INTERACTION_POINTS.recommendation_made;
    case "event_attended":
      return INTERACTION_POINTS.event_attended;
    case "business_created":
      return INTERACTION_POINTS.business_created;
    case "service_offered":
      return INTERACTION_POINTS.service_offered;
    case "ride_completed":
      return INTERACTION_POINTS.ride_completed;
    case "profile_completed":
      return INTERACTION_POINTS.profile_completed;
    default:
      return 0;
  }
}

/**
 * Requisitos para badges automáticos
 */
const BADGE_REQUIREMENTS = {
  // Badges básicos
  helpful_neighbor: {
    interaction_type: "helpful_vote",
    count: 10,
  },
  active_member: {
    total_interactions: 50,
  },
  trusted_reviewer: {
    interaction_type: "review_written",
    count: 5,
  },
  local_expert: {
    total_points: 500,
  },
  community_leader: {
    total_points: 1000,
  },

  // Badges de especialidade
  expert_reviewer: {
    interaction_type: "review_written",
    count: 100,
  },
  content_creator: {
    interaction_type: "post_created",
    count: 100,
  },
  super_helper: {
    interaction_type: "helpful_vote",
    count: 100,
  },

  // Badges de avaliação (verificados manualmente ou por query)
  highly_recommended: {
    reviews_count: 50,
    min_rating: 4.0,
  },
};

class CommunityServiceClass {
  // ============================================================================
  // GRUPOS — Boundary canônico para tabela `groups`
  // ✅ LOTE 7
  // ============================================================================

  /**
   * Busca lista de grupos, com filtro opcional por nome
   */
  async getGroupsPage(params: {
    search?: string;
    territoryFilter?: TerritoryFilter;
    offset?: number;
    limit?: number;
    groupIds?: string[];
    sortBy?: "recentes" | "populares" | "relevancia";
  }): Promise<{ items: GroupRow[]; totalCount: number; hasMore: boolean; nextOffset: number | null }> {
    const {
      search,
      territoryFilter,
      offset = 0,
      limit = 20,
      groupIds,
      sortBy = "recentes",
    } = params;
    try {
      let query = supabase
        .from("groups")
        .select(
          `
          *,
          profiles:created_by(name, avatar_url),
          members_count:group_members_new(count)
        `,
          { count: "exact" },
        )
        .range(offset, offset + limit - 1);

      // Ordenacao principal no backend para manter consistencia entre paginas
      if (sortBy === "populares") {
        query = query
          .order("members_count", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });
      } else {
        // "recentes" e fallback para "relevancia" (relevancia fina pode ser refinada no cliente)
        query = query.order("created_at", { ascending: false });
      }

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      if (groupIds && groupIds.length > 0) {
        query = query.in("id", groupIds);
      }

      if (territoryFilter?.scope === "location") {
        query = query.eq("location_id", territoryFilter.location_id);
      } else if (territoryFilter?.scope === "group" && territoryFilter.location_ids.length > 0) {
        query = query.in("location_id", territoryFilter.location_ids);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const normalized = ((data || []) as GroupRow[]).map((g) => ({
        ...g,
        members_count: g.members_count?.[0]?.count ?? 0,
      })) as GroupRow[];

      const totalCount = count ?? normalized.length;
      const hasMore = offset + normalized.length < totalCount;
      return {
        items: normalized,
        totalCount,
        hasMore,
        nextOffset: hasMore ? offset + limit : null,
      };
    } catch (error) {
      trackError(error as Error, {
        component: "CommunityService",
        action: "getGroupsPage",
      });
      return {
        items: [],
        totalCount: 0,
        hasMore: false,
        nextOffset: null,
      };
    }
  }

  async getGroups(search?: string, territoryFilter?: TerritoryFilter): Promise<GroupRow[]> {
    try {
      let query = supabase
        .from("groups")
        .select(`
          *,
          profiles:created_by(name, avatar_url),
          members_count:group_members_new(count)
        `)
        .order("created_at", { ascending: false });

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      if (territoryFilter?.scope === "location") {
        query = query.eq("location_id", territoryFilter.location_id);
      } else if (territoryFilter?.scope === "group" && territoryFilter.location_ids.length > 0) {
        query = query.in("location_id", territoryFilter.location_ids);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Normaliza members_count de [{count: N}] para número
      const normalized = ((data || []) as GroupRow[]).map((g) => ({
        ...g,
        members_count: g.members_count?.[0]?.count ?? 0,
      })) as GroupRow[];
      return normalized;
    } catch (error) {
      trackError(error as Error, {
        component: "CommunityService",
        action: "getGroups",
      });
      return [];
    }
  }

  /**
   * Busca um grupo por ID
   */
  async getGroupById(groupId: string): Promise<GroupRow | null> {
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("*, profiles:created_by(name, avatar_url)")
        .eq("id", groupId)
        .single<GroupRow>();

      if (error) throw error;
      return data;
    } catch (error) {
      trackError(error as Error, {
        component: "CommunityService",
        action: "getGroupById",
      });
      return null;
    }
  }

  /**
   * Cria um novo grupo
   */
  async createGroup(groupData: GroupCreateInput): Promise<GroupRow | null> {
    try {
      const groupType =
        groupData.category === "vizinhanca"
          ? "neighborhood"
          : groupData.category
            ? "interest"
            : "community";
      const payload = {
        name: groupData.name,
        description: groupData.description,
        category: groupData.category || "geral",
        is_private: Boolean(groupData.is_private),
        visibility: groupData.is_private ? "private" : "public",
        join_policy: groupData.join_policy || (groupData.is_private ? "approval" : "open"),
        posting_policy: groupData.posting_policy || "members",
        member_visibility: groupData.member_visibility || "members_count_public",
        media_policy: groupData.media_policy || "manual_download",
        rules: groupData.rules,
        capabilities: {
          text: true,
          images: true,
          audio: true,
          polls: true,
          chat: true,
          reactions: true,
          reports: true,
          share_link: true,
        },
        type: groupType,
        location_id: groupData.location_id,
      };

      const { data, error } = await supabase
        .from("groups")
        .insert(payload)
        .select()
        .single<GroupRow>();

      if (error) throw error;
      return data;
    } catch (error) {
      trackError(error as Error, {
        component: "CommunityService",
        action: "createGroup",
      });
      return null;
    }
  }

  // ============================================================================
  // INTERAÇÕES COMUNITÁRIAS
  // ============================================================================

  /**
   * Registra uma interação do usuário
   */
  async recordInteraction(
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

      const { data: interaction, error } = await supabase
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
          component: "CommunityService",
          action: "recordInteraction",
        });
        return { success: false, error: error.message };
      }

      // Verificar e atribuir badges automaticamente
      await this.checkAndAwardBadges(userId);

      return { success: true, interaction, points };
    } catch (error) {
      trackError(error as Error, {
        component: "CommunityService",
        action: "recordInteraction",
      });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Busca estatísticas do usuário
   */
  async getUserStats(userId: string): Promise<CommunityStats> {
    try {
      const { data: interactions, error } = await supabase
        .from("community_interactions")
        .select("interaction_type, points")
        .eq("user_id", userId);

      if (error) {
        // Tabela não existe ainda - retornar stats vazias silenciosamente
        // PGRST116 = relation does not exist (404)
        if (
          error.code === "PGRST204" ||
          error.code === "PGRST116" ||
          error.code === "42P01"
        ) {
          return {
            totalInteractions: 0,
            totalPoints: 0,
            interactionsByType: {},
          };
        }
        trackError(error, {
          component: "CommunityService",
          action: "getUserStats",
        });
        return { totalInteractions: 0, totalPoints: 0, interactionsByType: {} };
      }

      const totalInteractions = interactions?.length || 0;
      const totalPoints =
        interactions?.reduce((sum, i) => sum + (i.points || 0), 0) || 0;

      const interactionsByType: Record<string, number> = {};
      interactions?.forEach((i) => {
        interactionsByType[i.interaction_type] =
          (interactionsByType[i.interaction_type] || 0) + 1;
      });

      return { totalInteractions, totalPoints, interactionsByType };
    } catch (error) {
      // Só logar se não for erro de tabela inexistente
      if (!isTableNotFoundError(error)) {
        trackError(error as Error, {
          component: "CommunityService",
          action: "getUserStats",
        });
      }
      return { totalInteractions: 0, totalPoints: 0, interactionsByType: {} };
    }
  }

  // ============================================================================
  // BADGES E ACHIEVEMENTS
  // ============================================================================

  /**
   * Verifica e atribui badges automaticamente
   */
  async checkAndAwardBadges(userId: string): Promise<void> {
    try {
      const stats = await this.getUserStats(userId);
      const earnedAchievements =
        await GamificationService.getUserAchievements(userId);
      const earnedCodes = new Set<string>(
        earnedAchievements.map((a) => a.achievement_code),
      );

      for (const [badgeCode, requirement] of Object.entries(
        BADGE_REQUIREMENTS,
      )) {
        if (earnedCodes.has(badgeCode)) continue;

        let shouldAward = false;

        if ("interaction_type" in requirement) {
          const count =
            stats.interactionsByType[requirement.interaction_type] || 0;
          shouldAward = count >= requirement.count;
        } else if ("total_interactions" in requirement) {
          shouldAward =
            stats.totalInteractions >= requirement.total_interactions;
        } else if ("total_points" in requirement) {
          shouldAward = stats.totalPoints >= requirement.total_points;
        }

        if (shouldAward) {
          await this.awardBadge(userId, badgeCode);
        }
      }
    } catch (error) {
      trackError(error as Error, {
        component: "CommunityService",
        action: "checkAndAwardBadges",
      });
    }
  }

  /**
   * Atribui um badge ao usuário
   */
  async awardBadge(
    userId: string,
    badgeCode: string,
  ): Promise<{
    success: boolean;
    badgeCode?: string;
    alreadyEarned?: boolean;
    error?: string;
  }> {
    try {
      const { data: badge, error } = await supabase
        .from("community_badges")
        .select("id")
        .eq("code", badgeCode)
        .single();

      if (error || !badge) {
        trackError(new Error(`Badge ${badgeCode} not found`), {
          component: "CommunityService",
          action: "awardBadge",
        });
        return { success: false, error: "Badge not found" };
      }

      const success = await GamificationService.grantAchievement(
        userId,
        badgeCode,
      );

      if (!success) {
        return { success: true, alreadyEarned: true };
      }

      return { success: true, badgeCode };
    } catch (error) {
      trackError(error as Error, {
        component: "CommunityService",
        action: "awardBadge",
      });
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Busca badges disponíveis com progresso do usuário
   */
  async getAvailableBadges(userId: string): Promise<UserBadge[]> {
    try {
      const { data: allBadges, error } = await supabase
        .from("community_badges")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true });

      if (error || !allBadges) {
        trackError(error || new Error("No badges found"), {
          component: "CommunityService",
          action: "getAvailableBadges",
        });
        return [];
      }

      const userAchievements =
        await GamificationService.getUserAchievements(userId);
      const userBadgesMap = new Map(
        userAchievements.map((ua) => [ua.achievement_code, ua]),
      );

      return allBadges.map((badge) => {
        const userAchievement = userBadgesMap.get(badge.code);
        return {
          ...badge,
          earned_at: userAchievement?.earned_at || undefined,
          progress: userAchievement?.progress || 0,
          is_earned: !!userAchievement?.earned_at,
        };
      });
    } catch (error) {
      trackError(error as Error, {
        component: "CommunityService",
        action: "getAvailableBadges",
      });
      return [];
    }
  }

  // ============================================================================
  // PERFIS COMUNITÁRIOS
  // ============================================================================

  /**
   * Busca perfil comunitário completo do usuário
   */
  async getCommunityProfile(userId: string): Promise<{
    profile: CommunityProfile;
    badges: UserBadge[];
    stats: CommunityStats;
  } | null> {
    try {
      const { data: profile, error: profileError } = await supabase
        .from("community_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileError) {
        trackError(profileError, {
          component: "CommunityService",
          action: "getCommunityProfile",
        });
        return null;
      }

      // Gamificação desabilitada - tabelas não existem
      const badges: UserBadge[] = [];
      const stats: CommunityStats = {
        totalInteractions: 0,
        totalPoints: 0,
        interactionsByType: {},
      };

      return { profile, badges, stats };
    } catch (error) {
      trackError(error as Error, {
        component: "CommunityService",
        action: "getCommunityProfile",
      });
      return null;
    }
  }

  /**
   * Atualiza perfil comunitário do usuário
   */
  async updateCommunityProfile(
    userId: string,
    updates: Partial<
      Pick<
        CommunityProfile,
        "display_name" | "avatar_url" | "bio" | "city" | "neighborhood"
      >
    >,
  ): Promise<{ success: boolean; profile?: CommunityProfile; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("community_profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        trackError(error, {
          component: "CommunityService",
          action: "updateCommunityProfile",
        });
        return { success: false, error: error.message };
      }

      return { success: true, profile: data };
    } catch (error) {
      trackError(error as Error, {
        component: "CommunityService",
        action: "updateCommunityProfile",
      });
      return { success: false, error: (error as Error).message };
    }
  }

  // ============================================================================
  // RANKINGS E LEADERBOARDS
  // ============================================================================

  /**
   * Busca ranking de usuários
   */
  async getLeaderboard(
    limit: number = 10,
    _city?: string,
  ): Promise<CommunityProfile[]> {
    try {
      const query = supabase
        .from("community_profiles")
        .select("*")
        .order("total_points", { ascending: false });

      const { data, error } = await query.limit(limit);

      if (error) {
        trackError(error, {
          component: "CommunityService",
          action: "getLeaderboard",
        });
        return [];
      }

      return data || [];
    } catch (error) {
      trackError(error as Error, {
        component: "CommunityService",
        action: "getLeaderboard",
      });
      return [];
    }
  }

  /**
   * Busca ranking de engajamento por tipo de entidade
   */
  async getEngagementRanking(
    entityType: string,
    options?: {
      periodStart?: string;
      limit?: number;
    },
  ): Promise<EngagementScoreEntry[]> {
    const periodStart = options?.periodStart;
    const limit = options?.limit ?? 10;

    try {
      let query = supabase
        .from("civic_engagement_scores")
        .select("*")
        .eq("entity_type", entityType)
        .order("total_score", { ascending: false });

      if (periodStart) {
        query = query.gte("period_start", periodStart);
      }

      const { data, error } = await query.limit(limit);
      if (error) {
        if (isTableNotFoundError(error)) return [];
        trackError(error, {
          component: "CommunityService",
          action: "getEngagementRanking",
          metadata: { entityType, periodStart, limit },
        });
        return [];
      }

      return (data || []) as EngagementScoreEntry[];
    } catch (error) {
      if (!isTableNotFoundError(error)) {
        trackError(error as Error, {
          component: "CommunityService",
          action: "getEngagementRanking",
          metadata: { entityType, periodStart, limit },
        });
      }
      return [];
    }
  }

  /**
   * Calcula nível do usuário baseado em pontos
   */
  getUserLevel(totalPoints: number): UserLevel {
    const levels = [
      {
        level: "bronze",
        name: "Bronze",
        icon: "🥉",
        color: "#CD7F32",
        minPoints: 0,
        maxPoints: 100,
      },
      {
        level: "silver",
        name: "Prata",
        icon: "🥈",
        color: "#C0C0C0",
        minPoints: 100,
        maxPoints: 500,
      },
      {
        level: "gold",
        name: "Ouro",
        icon: "🥇",
        color: "#FFD700",
        minPoints: 500,
        maxPoints: 1000,
      },
      {
        level: "platinum",
        name: "Platina",
        icon: "💎",
        color: "#E5E4E2",
        minPoints: 1000,
        maxPoints: 5000,
      },
      {
        level: "diamond",
        name: "Diamante",
        icon: "💎",
        color: "#B9F2FF",
        minPoints: 5000,
        maxPoints: Infinity,
      },
    ];

    const currentLevel =
      levels.find(
        (l) => totalPoints >= l.minPoints && totalPoints < l.maxPoints,
      ) || levels[0];

    const currentIndex = levels.indexOf(currentLevel);
    const nextLevel = levels[currentIndex + 1] || currentLevel;

    const progress =
      nextLevel.maxPoints === Infinity
        ? 100
        : Math.min(
            ((totalPoints - currentLevel.minPoints) /
              (nextLevel.minPoints - currentLevel.minPoints)) *
              100,
            100,
          );

    return {
      level: currentLevel.level,
      name: currentLevel.name,
      icon: currentLevel.icon,
      color: currentLevel.color,
      nextLevel: nextLevel.name,
      nextLevelPoints: nextLevel.minPoints,
      progress: Math.round(progress),
    };
  }
}

export const CommunityService = new CommunityServiceClass();
export { CommunityService as communityService };
