import React from "react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { motion } from "framer-motion";
import {
  Trophy,
  Award,
  Target,
  TrendingUp,
  Calendar,
  BarChart3,
  Zap,
} from "lucide-react";
import {
  getNivel,
  getProgresso,
  badges,
} from "@/core/gamification/data/gamification";
import { cn } from "@/shared/utils/cn";

/**
 * GamificationProfileView — Shape mínimo para exibição de gamificação
 *
 * Não usa LegacyProfile completo — apenas os campos necessários.
 * Quando pontos/badges forem migrados para domain/Profile, este tipo
 * será atualizado para usar Profile diretamente.
 */
interface GamificationProfileView {
  /** Pontos de gamificação (campo legado — mapeado de `reputation` ou `pontos`) */
  pontos?: number;
  /** Badges conquistados (campo legado) */
  badges?: string[];
  /** Data de criação (para exibir "membro desde") */
  created_at: string;
}

interface GamificationCardProps {
  profile: GamificationProfileView;
  onViewRanking: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export function GamificationCard({
  profile,
  onViewRanking,
}: GamificationCardProps) {
  const profileBadges = profile.badges ?? [];
  const nivel = getNivel(profile.pontos || 0);
  const progresso = getProgresso(profile.pontos || 0);
  const memberSince = profile.created_at
    ? new Date(profile.created_at).getFullYear()
    : new Date().getFullYear();
  const pontosParaProximo = Math.max(0, nivel.maxPontos - (profile.pontos || 0));

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <motion.div {...fadeUp} transition={{ duration: 0.3 }}>
        <h2 className="text-xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Progresso & Conquistas
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Nível {nivel.nivel} — {nivel.name}
        </p>
      </motion.div>

      {/* Level Progress Card */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Nível {nivel.nivel}</h3>
                <p className="text-xs text-muted-foreground">{nivel.name}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-primary tabular-nums">
                {profile.pontos || 0}
              </span>
              <span className="text-xs text-muted-foreground ml-1">/ {nivel.maxPontos} pts</span>
            </div>
          </div>

          <Progress value={progresso} className="h-2" />

          <p className="text-xs text-muted-foreground mt-2">
            {pontosParaProximo > 0
              ? `${pontosParaProximo} pontos para o próximo nível`
              : "Nível máximo atingido! 🎉"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          <StatCell icon={Award} label="Nível" value={String(nivel.nivel)} />
          <StatCell icon={Target} label="Meta" value={String(nivel.maxPontos)} />
          <StatCell icon={TrendingUp} label="Progresso" value={`${progresso}%`} />
          <StatCell icon={Calendar} label="Desde" value={String(memberSince)} />
        </div>
      </motion.div>

      {/* Badges */}
      {profileBadges.length > 0 && (
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div className="p-5 border-b border-border flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Award className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Conquistas</h3>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              {profileBadges.map((badgeId) => {
                const badge = badges.find((b) => b.id === badgeId);
                if (!badge) return null;
                return (
                  <Badge
                    key={badge.id}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border-0",
                      badge.cor
                    )}
                  >
                    {badge.icone} {badge.name}
                  </Badge>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Ranking CTA */}
      <motion.div {...fadeUp} transition={{ duration: 0.3, delay: 0.15 }}>
        <Button
          variant="outline"
          className="w-full gap-2 h-11 rounded-xl border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all"
          onClick={onViewRanking}
        >
          <BarChart3 className="h-4 w-4 text-primary" />
          Ver Ranking Completo
        </Button>
      </motion.div>
    </div>
  );
}

function StatCell({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5 p-4 hover:bg-secondary/30 transition-colors">
      <Icon className="h-4 w-4 text-primary shrink-0" />
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </div>
        <div className="text-sm font-bold text-foreground tabular-nums">{value}</div>
      </div>
    </div>
  );
}
