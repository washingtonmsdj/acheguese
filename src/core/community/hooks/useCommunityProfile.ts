/**
 * useCommunityProfile Hook - MIGRADO PARA SSOT
 */

import { useState, useEffect, useCallback } from "react";
import { useSessionContext } from "@/core/session";
import {
  communityService,
  type CommunityProfile as ServiceCommunityProfile,
} from "@/core/community/services";
import { logger } from "@/shared/utils/logger";

export interface CommunityProfile {
  id: string;
  user_id: string;
  display_name?: string;
  avatar_url: string | null;
  bio: string | null;
  public_city?: string;
  public_neighborhood?: string;
  verified_resident?: boolean;
  verified_at?: string | null;
  created_at: string;
}

export interface CommunityBadge {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  category: string | null;
  earned_at?: string;
  progress?: number;
}

export interface CommunityStats {
  total_interactions: number;
  total_points: number;
  badges_count: number;
  rank?: number;
}

export function useCommunityProfile() {
  const { user } = useSessionContext();
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [badges, setBadges] = useState<CommunityBadge[]>([]);
  const [stats, setStats] = useState<CommunityStats>({
    total_interactions: 0,
    total_points: 0,
    badges_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunityProfile = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const data = await communityService.getCommunityProfile(user.id);

      // Map service profile to local type (adding missing fields with defaults)
      if (data?.profile) {
        setProfile({
          ...data.profile,
          verified_resident: false,
          verified_at: null,
        } as CommunityProfile);
      }
      setBadges((data?.badges ?? []) as unknown as CommunityBadge[]);
      setStats({
        total_interactions: data?.stats?.totalInteractions ?? 0,
        total_points: data?.stats?.totalPoints ?? 0,
        badges_count: 0,
        rank: undefined,
      });
    } catch (err: unknown) {
      logger.error("Error fetching community profile:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar perfil comunitario");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCommunityProfile();
    } else {
      setLoading(false);
    }
  }, [user, fetchCommunityProfile]);

  async function updateProfile(updates: Partial<CommunityProfile>) {
    if (!user || !profile) return;

    try {
      await communityService.updateCommunityProfile(user.id, updates);
      setProfile({ ...profile, ...updates });
      return { success: true };
    } catch (err: unknown) {
      logger.error("Error updating community profile:", err);
      return { success: false, error: err instanceof Error ? err.message : "Erro ao atualizar perfil" };
    }
  }

  return {
    profile,
    badges,
    stats,
    loading,
    error,
    updateProfile,
    refetch: fetchCommunityProfile,
  };
}
