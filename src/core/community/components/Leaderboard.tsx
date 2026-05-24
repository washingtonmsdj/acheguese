import { useState, useEffect, useCallback } from "react";
import { Trophy, Medal, Award, TrendingUp, MapPin } from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { CommunityService } from "@/core/community/services/CommunityService";
import { cn } from "@/shared/utils/cn";
import { logger } from "@/shared/utils/logger";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  city: string;
  neighborhood: string;
  verified_resident: boolean;
  total_points: number;
  total_interactions: number;
  badges_count: number;
}

interface LeaderboardProps {
  limit?: number;
  city?: string;
  showCity?: boolean;
  compact?: boolean;
}

interface LeaderboardSourceEntry {
  id?: string;
  user_id?: string;
  name?: string;
  display_name?: string;
  avatar_url?: string | null;
  city?: string;
  neighborhood?: string;
  verified_resident?: boolean;
  total_points?: number;
  total_interactions?: number;
  badges_count?: number;
}

export function Leaderboard({
  limit = 10,
  city,
  showCity = true,
  compact = false,
}: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await CommunityService.getLeaderboard(limit, city);
      setEntries(
        (data as LeaderboardSourceEntry[]).map((d) => ({
          user_id: d.user_id || d.id || "",
          display_name: d.display_name || d.name || "Usuário",
          avatar_url: d.avatar_url || null,
          city: d.city || "",
          neighborhood: d.neighborhood || "",
          verified_resident: d.verified_resident ?? false,
          total_points: d.total_points || 0,
          total_interactions: d.total_interactions || 0,
          badges_count: d.badges_count || 0,
        })),
      );
    } catch (error) {
      logger.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }, [limit, city]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Nenhum usuário no ranking ainda
        </p>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {entries.slice(0, 3).map((entry, index) => (
          <div
            key={entry.user_id}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
          >
            <div className="flex-shrink-0">{getRankIcon(index + 1)}</div>
            <Avatar className="w-10 h-10">
              <AvatarImage src={entry.avatar_url || undefined} />
              <AvatarFallback>
                {entry.display_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {entry.display_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {entry.total_points} pts
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h2 className="text-lg font-bold">Ranking da Comunidade</h2>
      </div>

      <div className="space-y-3">
        {entries.map((entry, index) => {
          const rank = index + 1;
          const isTopThree = rank <= 3;

          return (
            <div
              key={entry.user_id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg transition-colors",
                isTopThree
                  ? "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border border-yellow-200 dark:border-yellow-800"
                  : "bg-muted/30 hover:bg-muted/50",
              )}
            >
              {/* Posição */}
              <div className="flex-shrink-0 w-12 text-center">
                {isTopThree ? (
                  getRankIcon(rank)
                ) : (
                  <span className="text-lg font-bold text-muted-foreground">
                    {rank}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <Avatar
                className={cn(
                  "w-12 h-12",
                  isTopThree && "ring-2 ring-yellow-400",
                )}
              >
                <AvatarImage src={entry.avatar_url || undefined} />
                <AvatarFallback>
                  {entry.display_name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold truncate">{entry.display_name}</p>
                  {entry.verified_resident && (
                    <Badge variant="secondary" className="text-xs">
                      Verificado
                    </Badge>
                  )}
                </div>
                {showCity && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {entry.neighborhood}, {entry.city}
                  </p>
                )}
              </div>

              {/* Estatísticas */}
              <div className="flex-shrink-0 text-right">
                <div className="flex items-center gap-1 justify-end mb-1">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-lg font-bold">
                    {entry.total_points}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    {entry.badges_count}
                  </span>
                  <span>{entry.total_interactions} ações</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/**
 * Retorna o ícone apropriado para cada posição do ranking
 */
function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Trophy className="h-8 w-8 text-yellow-500" />;
    case 2:
      return <Medal className="h-8 w-8 text-gray-400" />;
    case 3:
      return <Medal className="h-8 w-8 text-amber-600" />;
    default:
      return null;
  }
}
