import React from "react";
import { Award, Crown, Medal, Trophy, Zap } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { NeighborRank } from "@/shared/types/mobilidade";

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
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold",
        cfg.bg,
        cfg.border,
        cfg.color,
        size === "xs" && "px-1.5 text-[0.5rem]",
        size === "sm" && "text-[0.6rem]",
        size === "md" && "px-2.5 py-1 text-xs",
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
      <div className="rounded-2xl border border-white/10 bg-[#1E2529] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <h3 className="text-sm font-bold text-white">Niveis de Ranking</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(rankConfig) as [NeighborRank, (typeof rankConfig)[NeighborRank]][]).map(
            ([key, cfg]) => (
              <div key={key} className={cn("rounded-xl border p-2.5", cfg.bg, cfg.border)}>
                <div className={cn("mb-1 flex items-center gap-1.5", cfg.color)}>
                  {cfg.icon}
                  <span className="text-xs font-bold">{cfg.label}</span>
                </div>
                <p className="text-[0.6rem] text-gray-500">
                  {cfg.max === Infinity
                    ? `${cfg.min.toLocaleString()}+ pts`
                    : `${cfg.min.toLocaleString()} - ${cfg.max.toLocaleString()} pts`}
                </p>
              </div>
            ),
          )}
        </div>
        <div className="mt-3 rounded-xl border border-white/5 bg-white/5 p-2.5">
          <p className="text-[0.6rem] text-gray-400">
            <span className="font-semibold text-teal-400">Como ganhar pontos:</span>{" "}
            avaliacoes positivas, viagens concluidas e atividade consistente na plataforma.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#1E2529] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <h3 className="text-sm font-bold text-white">Top Vizinhos</h3>
        </div>
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center">
          <p className="text-xs font-semibold text-white">Ranking ainda sem dados suficientes</p>
          <p className="mt-1 text-[0.65rem] text-gray-500">
            O ranking sera exibido quando houver dados reais de corridas e reputacao.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-teal-400/20 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/20">
            <Crown className="h-6 w-6 text-yellow-400" />
          </div>
          <div className="flex-1">
            <p className="mb-0.5 text-xs text-gray-400">Seu ranking atual</p>
            <p className="text-sm font-bold text-white">Sem classificacao ainda</p>
            <p className="mt-0.5 text-[0.6rem] text-teal-300">
              Complete corridas e receba avaliacoes para formar seu ranking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
