/**
 * CommunityService - SSOT para sistema comunitário
 *
 * Escopo:
 * - Boundary canônico para groups/community_profiles
 * - Facade de gamificação comunitária (interações, badges, ranking)
 */

import type { TerritoryFilter } from "@/core/location";
import { supabase } from "@/integrations/supabase";
import type { FlexibleMetadata } from "@/shared/types/supabase.types";
import { trackError } from "@/shared/utils/errorTracking";
import { CommunityGamificationService } from "./CommunityGamificationService";
import {
  CommunityGroupsService,
  type GroupCreateInput,
  type GroupRow,
} from "./CommunityGroupsService";
import type {
  CommunityProfile,
  CommunityStats,
  EngagementScoreEntry,
  InteractionType,
  UserBadge,
  UserLevel,
} from "./community.types";

const db = supabase as any;

class CommunityServiceClass {
  async getGroupsPage(params: {
    search?: string;
    territoryFilter?: TerritoryFilter;
    offset?: number;
    limit?: number;
    groupIds?: string[];
    sortBy?: "recentes" | "populares" | "relevancia";
  }): Promise<{ items: GroupRow[]; totalCount: number; hasMore: boolean; nextOffset: number | null }> {
    return CommunityGroupsService.getGroupsPage(params);
  }

  async getGroups(search?: string, territoryFilter?: TerritoryFilter): Promise<GroupRow[]> {
    return CommunityGroupsService.getGroups(search, territoryFilter);
  }

  async getGroupById(groupId: string): Promise<GroupRow | null> {
    return CommunityGroupsService.getGroupById(groupId);
  }

  async createGroup(groupData: GroupCreateInput): Promise<GroupRow | null> {
    return CommunityGroupsService.createGroup(groupData);
  }

  async recordInteraction(
    userId: string,
    interactionType: InteractionType,
    targetType?: string,
    targetId?: string,
    metadata?: FlexibleMetadata,
  ) {
    return CommunityGamificationService.recordInteraction(
      userId,
      interactionType,
      targetType,
      targetId,
      metadata,
    );
  }

  async getUserStats(userId: string): Promise<CommunityStats> {
    return CommunityGamificationService.getUserStats(userId);
  }

  async checkAndAwardBadges(userId: string): Promise<void> {
    return CommunityGamificationService.checkAndAwardBadges(userId);
  }

  async awardBadge(userId: string, badgeCode: string) {
    return CommunityGamificationService.awardBadge(userId, badgeCode);
  }

  async getAvailableBadges(userId: string): Promise<UserBadge[]> {
    return CommunityGamificationService.getAvailableBadges(userId);
  }

  async getCommunityProfile(userId: string): Promise<{
    profile: CommunityProfile;
    badges: UserBadge[];
    stats: CommunityStats;
  } | null> {
    try {
      const { data: profile, error: profileError } = await db
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

  async updateCommunityProfile(
    userId: string,
    updates: Partial<
      Pick<CommunityProfile, "display_name" | "avatar_url" | "bio">
    >,
  ): Promise<{ success: boolean; profile?: CommunityProfile; error?: string }> {
    try {
      const { data, error } = await db
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

  async getLeaderboard(limit: number = 10, _city?: string): Promise<CommunityProfile[]> {
    return CommunityGamificationService.getLeaderboard(limit);
  }

  async getEngagementRanking(
    entityType: string,
    options?: {
      periodStart?: string;
      limit?: number;
    },
  ): Promise<EngagementScoreEntry[]> {
    return CommunityGamificationService.getEngagementRanking(entityType, options);
  }

  getUserLevel(totalPoints: number): UserLevel {
    return CommunityGamificationService.getUserLevel(totalPoints);
  }
}

export const CommunityService = new CommunityServiceClass();
export { CommunityService as communityService };

export type {
  CommunityProfile,
  CommunityStats,
  EngagementScoreEntry,
  InteractionType,
  UserBadge,
  UserLevel,
} from "./community.types";
