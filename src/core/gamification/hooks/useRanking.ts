/**
 * ✅ SSOT - Hook useRanking
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles";

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

        const data = await profileService.getRanking(50);

        if (!data || data.length === 0) {
          // TODO: Implementar dados reais do Supabase
          setRanking([]);
          if (user) {
            setCurrentUserRank(null);
          }
        } else {
          const rankingData: RankingEntry[] = data.map((p) => ({
            id: p.id,
            name: p.name,
            avatar_url: p.avatar_url,
            pontos: p.pontos,
            badges: [],
          }));
          setRanking(rankingData);

          if (user) {
            const userEntry = rankingData.find((p) => p.id === user.id);
            if (userEntry) {
              setCurrentUserRank(userEntry);
            } else {
              const userData = await profileService.getProfileById(user.id);
              if (userData) {
                setCurrentUserRank({
                  id: userData.id,
                  name: userData.name || "Você",
                  avatar_url: userData.avatar_url || "",
                  pontos: userData.pontos || 0,
                  badges: [],
                });
              }
            }
          }
        }
      } catch (err) {
        logger.error("❌ Erro ao carregar ranking:", err);
        setRanking([]);
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
