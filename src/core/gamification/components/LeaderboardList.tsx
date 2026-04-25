import React from "react";
import { motion } from "framer-motion";
import { Trophy, Medal } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { cn } from "@/shared/utils/cn";
import {
  badges,
  getNivel,
  getProgresso,
} from "@/core/gamification/data/gamification";
import type { RankingEntry } from "@/core/gamification/hooks/useRanking";

const podiumColors = ["text-yellow-500", "text-gray-400", "text-amber-700"];
const podiumIcons = [Trophy, Medal, Medal];

function getPodiumColor(index: number): string {
  switch (index) {
    case 0:
      return podiumColors[0];
    case 1:
      return podiumColors[1];
    case 2:
      return podiumColors[2];
    default:
      return "text-muted-foreground";
  }
}

function getPodiumIcon(index: number) {
  switch (index) {
    case 0:
      return podiumIcons[0];
    case 1:
      return podiumIcons[1];
    case 2:
      return podiumIcons[2];
    default:
      return null;
  }
}

interface LeaderboardListProps {
  ranking: RankingEntry[];
}

export function LeaderboardList({ ranking }: LeaderboardListProps) {
  return (
    <div className="px-4 space-y-2">
      {ranking.map((entry, i) => {
        const PodiumIcon = i < 3 ? getPodiumIcon(i) : null;
        const nivel = getNivel(entry.pontos);
        const progresso = getProgresso(entry.pontos);
        const avatarInitial = entry.name.charAt(0);

        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-colors",
              i === 0 ? "bg-yellow-500/5 border-yellow-500/15" : "bg-card",
            )}
          >
            {/* Position */}
            <div className="flex items-center justify-center h-8 w-8 flex-shrink-0">
              {PodiumIcon ? (
                <PodiumIcon className={cn("h-5 w-5", getPodiumColor(i))} />
              ) : (
                <span className="text-sm font-bold text-muted-foreground">
                  #{i + 1}
                </span>
              )}
            </div>

            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={entry.avatar_url} />
              <AvatarFallback>{avatarInitial}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold truncate">
                  {entry.name}
                </span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                  {nivel.name}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <Progress value={progresso} className="flex-1 h-1" />
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {entry.pontos} pts
                </span>
              </div>

              {/* Badges preview */}
              {entry.badges && entry.badges.length > 0 && (
                <div className="flex gap-1 mt-1.5">
                  {entry.badges.slice(0, 4).map((bId) => {
                    const badge = badges.find((x) => x.id === bId);
                    return badge ? (
                      <span
                        key={badge.id}
                        className="text-xs"
                        title={badge.name}
                      >
                        {badge.icone}
                      </span>
                    ) : null;
                  })}
                  {entry.badges.length > 4 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{entry.badges.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
