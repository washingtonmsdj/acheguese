import React from "react";
import { motion } from "framer-motion";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Progress } from "@/shared/components/ui/progress";
import { cn } from "@/shared/utils/cn";
import {
  badges,
  getNivel,
  getProgresso,
} from "@/core/gamification/data/gamification";
import type { RankingEntry } from "@/core/gamification/hooks/useRanking";

interface UserPositionCardProps {
  currentUserRank: RankingEntry;
  position: number;
  onBadgeClick: (badgeId: string) => void;
}

export function UserPositionCard({
  currentUserRank,
  position,
  onBadgeClick,
}: UserPositionCardProps) {
  const nivel = getNivel(currentUserRank.pontos);
  const progresso = getProgresso(currentUserRank.pontos);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-4 p-4 rounded-2xl bg-primary/5 border border-primary/10"
    >
      <p className="text-xs font-medium text-primary mb-2">Sua posição</p>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage src={currentUserRank.avatar_url} />
            <AvatarFallback>{currentUserRank.name[0]}</AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
            #{position}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{currentUserRank.name}</p>
          <p className="text-xs text-muted-foreground">{nivel.name}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <Progress value={progresso} className="flex-1 h-1.5" />
            <span className="text-[10px] text-muted-foreground font-medium">
              {currentUserRank.pontos} pts
            </span>
          </div>
        </div>
      </div>

      {/* User badges */}
      {currentUserRank.badges && currentUserRank.badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {currentUserRank.badges.map((bId) => {
            const badge = badges.find((x) => x.id === bId);
            if (!badge) return null;
            const BadgeIcon = badge.icone;

            return (
              <button
                key={badge.id}
                onClick={() => onBadgeClick(badge.id)}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                  badge.cor,
                )}
              >
                <BadgeIcon className="mr-1 inline h-3 w-3" aria-hidden="true" />
                {badge.name}
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
