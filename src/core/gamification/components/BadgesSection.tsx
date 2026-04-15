import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/shared/utils/cn";
import { badges } from "@/core/gamification/data/gamification";
import type { RankingEntry } from "@/core/gamification/hooks/useRanking";

interface BadgesSectionProps {
  currentUserRank: RankingEntry | null;
  onBadgeClick: (badgeId: string) => void;
}

export function BadgesSection({
  currentUserRank,
  onBadgeClick,
}: BadgesSectionProps) {
  return (
    <div className="px-4 mt-6">
      <h2 className="text-sm font-bold font-display mb-3">
        Todas as Conquistas
      </h2>

      <div className="grid grid-cols-2 gap-2">
        {badges.map((badge, i) => {
          const earned = currentUserRank?.badges?.includes(badge.id);

          return (
            <motion.button
              key={badge.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              onClick={() => onBadgeClick(badge.id)}
              className={cn(
                "flex flex-col items-center p-3 rounded-xl border text-center transition-all",
                earned
                  ? "bg-card border-border"
                  : "bg-muted/50 border-border/50 opacity-50",
              )}
            >
              <span className="text-2xl mb-1">{badge.icone}</span>
              <span className="text-xs font-semibold">{badge.name}</span>
              <span className="text-[10px] text-muted-foreground">
                {badge.criterio}
              </span>
              {earned && (
                <span className="text-[9px] text-success font-medium mt-1">
                  ✓ Conquistado
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
