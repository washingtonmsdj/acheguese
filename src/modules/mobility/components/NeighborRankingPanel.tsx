import React from "react";
import {
  Trophy,
  Star,
  Car,
  Clock,
  Shield,
  ChevronRight,
  Crown,
  Medal,
  Award,
  Zap,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import type { NeighborProfile, NeighborRank } from "@/shared/types/mobilidade";

const rankConfig: Record<
  NeighborRank,
  {
    label: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    border: string;
    min: number;
    max: number;
  }
> = {
  bronze: {
    label: "Vizinho Bronze",
    icon: <Medal className="h-3.5 w-3.5" />,
    color: "text-amber-600",
    bg: "bg-amber-900/20",
    border: "border-amber-700/30",
    min: 0,
    max: 999,
  },
  prata: {
    label: "Vizinho Prata",
    icon: <Award className="h-3.5 w-3.5" />,
    color: "text-gray-300",
    bg: "bg-gray-500/10",
    border: "border-gray-400/30",
    min: 1000,
    max: 2999,
  },
  ouro: {
    label: "Vizinho Ouro",
    icon: <Crown className="h-3.5 w-3.5" />,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    min: 3000,
    max: 5999,
  },
  elite: {
    label: "Vizinho Elite",
    icon: <Zap className="h-3.5 w-3.5" />,
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/30",
    min: 6000,
    max: Infinity,
  },
};

// TODO: Implementar hook para buscar dados reais do Supabase
// const { data: neighbors } = useNeighborRanking();
const MOCK_NEIGHBORS: NeighborProfile[] = [];

export function RankBadge({
  rank,
  size = "sm",
}: {
  rank: NeighborRank;
  size?: "xs" | "sm" | "md";
}) {
  const cfg = rankConfig[rank];
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-semibold",
        cfg.bg,
        cfg.border,
        cfg.color,
        size === "xs" && "text-[0.5rem] px-1.5",
        size === "sm" && "text-[0.6rem]",
        size === "md" && "text-xs px-2.5 py-1",
      )}
    >
      {cfg.icon}
      {cfg.label}
    </div>
  );
}

export function NeighborRankingPanel() {
  return (
    <div className="space-y-4">
      {/* Rank levels overview */}
      <div className="rounded-2xl border border-white/10 bg-[#1E2529] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <h3 className="text-sm font-bold text-white">Níveis de Ranking</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(
            Object.entries(rankConfig) as [
              NeighborRank,
              (typeof rankConfig)[NeighborRank],
            ][]
          ).map(([key, cfg]) => (
            <div
              key={key}
              className={cn("p-2.5 rounded-xl border", cfg.bg, cfg.border)}
            >
              <div className={cn("flex items-center gap-1.5 mb-1", cfg.color)}>
                {cfg.icon}
                <span className="text-xs font-bold">{cfg.label}</span>
              </div>
              <p className="text-[0.6rem] text-gray-500">
                {cfg.max === Infinity
                  ? `${cfg.min.toLocaleString()}+ pts`
                  : `${cfg.min.toLocaleString()} – ${cfg.max.toLocaleString()} pts`}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
          <p className="text-[0.6rem] text-gray-400">
            <span className="text-teal-400 font-semibold">
              Como ganhar pontos:
            </span>{" "}
            avaliações positivas (+50pts), viagens concluídas (+20pts), tempo na
            plataforma (+10pts/semana)
          </p>
        </div>
      </div>

      {/* Top neighbors */}
      <div className="rounded-2xl border border-white/10 bg-[#1E2529] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <h3 className="text-sm font-bold text-white">Top Vizinhos</h3>
        </div>
        <div className="space-y-2">
          {MOCK_NEIGHBORS.map((neighbor, index) => {
            const cfg = rankConfig[neighbor.rank];
            const getInitials = (name: string) =>
              name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

            return (
              <div
                key={neighbor.id}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-xl border transition-all",
                  index === 0
                    ? "bg-yellow-500/5 border-yellow-500/20"
                    : "bg-white/[0.02] border-white/5",
                )}
              >
                {/* Position */}
                <div
                  className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
                    index === 0
                      ? "bg-yellow-500/20 text-yellow-400"
                      : index === 1
                        ? "bg-gray-400/20 text-gray-300"
                        : index === 2
                          ? "bg-amber-700/20 text-amber-600"
                          : "bg-white/5 text-gray-500",
                  )}
                >
                  {index + 1}
                </div>

                {/* Avatar */}
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={neighbor.avatar_url} />
                  <AvatarFallback className="text-[0.6rem] bg-gradient-to-br from-teal-400 to-cyan-400 text-white font-bold">
                    {getInitials(neighbor.name)}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-white">
                      {neighbor.name}
                    </span>
                    <RankBadge rank={neighbor.rank} size="xs" />
                  </div>
                  <div className="flex items-center gap-2 text-[0.6rem] text-gray-500 mt-0.5">
                    <span className="flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
                      {neighbor.avg_rating}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <Car className="h-2.5 w-2.5" />
                      {neighbor.total_rides} viagens
                    </span>
                  </div>
                </div>

                {/* Points */}
                <div className="text-right flex-shrink-0">
                  <p className={cn("text-sm font-bold", cfg.color)}>
                    {neighbor.points.toLocaleString()}
                  </p>
                  <p className="text-[0.55rem] text-gray-600">pontos</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Your rank card */}
      <div className="rounded-2xl border border-teal-400/20 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center flex-shrink-0">
            <Crown className="h-6 w-6 text-yellow-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-0.5">Seu ranking atual</p>
            <div className="flex items-center gap-2">
              <RankBadge rank="prata" size="sm" />
              <span className="text-sm font-bold text-white">2.100 pts</span>
            </div>
            <p className="text-[0.6rem] text-teal-300 mt-0.5">
              Faltam 900 pts para Vizinho Ouro
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"
              style={{ width: "70%" }}
            />
          </div>
          <div className="flex justify-between text-[0.55rem] text-gray-600 mt-1">
            <span>Prata · 1.000 pts</span>
            <span>Ouro · 3.000 pts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
