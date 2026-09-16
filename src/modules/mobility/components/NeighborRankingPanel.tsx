import type { ReactNode } from "react";
import { Award, Crown, Medal, Trophy, Zap } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { getRecordValue } from "@/shared/utils/recordLookup";

type NeighborRank = "bronze" | "prata" | "ouro" | "elite";

const rankConfig: Record<
  NeighborRank,
  {
    label: string;
    icon: ReactNode;
    color: string;
    bg: string;
    border: string;
    min: number;
    max: number;
  }
> = {
  bronze: {
    label: "Vizinho Bronze",
    icon: <Medal className="h-3.5 w-3.5" aria-hidden="true" />,
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    min: 0,
    max: 999,
  },
  prata: {
    label: "Vizinho Prata",
    icon: <Award className="h-3.5 w-3.5" aria-hidden="true" />,
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
    min: 1000,
    max: 2999,
  },
  ouro: {
    label: "Vizinho Ouro",
    icon: <Crown className="h-3.5 w-3.5" aria-hidden="true" />,
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    min: 3000,
    max: 5999,
  },
  elite: {
    label: "Vizinho Elite",
    icon: <Zap className="h-3.5 w-3.5" aria-hidden="true" />,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
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
  const cfg = getRecordValue(rankConfig, rank) ?? rankConfig.bronze;
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
      <section className="rounded-2xl border bg-card p-4 text-card-foreground">
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-warning" aria-hidden="true" />
          <h3 className="text-sm font-bold">Níveis de ranking</h3>
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
              className={cn("rounded-xl border p-2.5", cfg.bg, cfg.border)}
            >
              <div className={cn("mb-1 flex items-center gap-1.5", cfg.color)}>
                {cfg.icon}
                <span className="text-xs font-bold">{cfg.label}</span>
              </div>
              <p className="text-[0.65rem] text-muted-foreground">
                {cfg.max === Infinity
                  ? `${cfg.min.toLocaleString("pt-BR")}+ pts`
                  : `${cfg.min.toLocaleString("pt-BR")} – ${cfg.max.toLocaleString("pt-BR")} pts`}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl border bg-muted/40 p-2.5">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">Como ganhar pontos:</span>{" "}
            avaliações positivas, viagens concluídas e atividade consistente na plataforma.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4 text-card-foreground">
        <div className="mb-3 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-warning" aria-hidden="true" />
          <h3 className="text-sm font-bold">Top vizinhos</h3>
        </div>
        <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-center">
          <p className="text-xs font-semibold text-foreground">
            Ranking ainda sem dados suficientes
          </p>
          <p className="mt-1 text-[0.7rem] text-muted-foreground">
            O ranking será exibido quando houver dados reais de corridas e reputação.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
            <Crown className="h-6 w-6 text-warning" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-0.5 text-xs text-muted-foreground">Seu ranking atual</p>
            <p className="text-sm font-bold text-foreground">Sem classificação ainda</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Complete corridas e receba avaliações para formar seu ranking.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
