/**
 *  SSOT - Hook useRanking
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";

export interface RankingEntry {
  id: string;
  name: string;
  avatar_url: string;
  pontos: number;
  badges: string[];
}

export function useRanking() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<RankingEntry | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRanking() {
      try {
        setLoading(true);

        const [data, activeProfile] = await Promise.all([
          profileService.getRanking(50),
          user ? profileService.getActiveProfile(user.id) : Promise.resolve(null),
        ]);

        const rankingData: RankingEntry[] = (data ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          avatar_url: p.avatar_url,
          pontos: p.pontos,
          badges: [],
        }));

        setRanking(rankingData);

        if (!activeProfile) {
          setCurrentUserRank(null);
          return;
        }

        const activeProfileEntry = rankingData.find((p) => p.id === activeProfile.id);
        setCurrentUserRank(activeProfileEntry ?? {
          id: activeProfile.id,
          name: activeProfile.name || "Voce",
          avatar_url: activeProfile.avatar_url || "",
          pontos: activeProfile.pontos || 0,
          badges: [],
        });
      } catch (err) {
        logger.error(" Erro ao carregar ranking:", err);
        setRanking([]);
        setCurrentUserRank(null);
      } finally {
        setLoading(false);
      }
    }

    loadRanking();
  }, [user]);

  const getCurrentUserPosition = () => {
    if (!currentUserRank) return 0;
    return ranking.findIndex((r) => r.id === currentUserRank.id) + 1;
  };

  return {
    ranking,
    currentUserRank,
    loading,
    currentUserPosition: getCurrentUserPosition(),
  };
}
