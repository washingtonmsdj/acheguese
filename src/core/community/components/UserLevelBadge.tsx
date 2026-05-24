import { CommunityService } from "@/core/community/services/CommunityService";
import { Card } from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
import { Award, Crown, Gem, Medal, Sparkles, TrendingUp, type LucideIcon } from "lucide-react";

interface UserLevelBadgeProps {
  totalPoints: number;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
}

export function UserLevelBadge({
  totalPoints,
  size = "md",
  showProgress = true,
}: UserLevelBadgeProps) {
  const levelInfo = CommunityService.getUserLevel(totalPoints);
  const levelIcons: Record<string, LucideIcon> = {
    bronze: Medal,
    silver: Medal,
    gold: Crown,
    platinum: Award,
    diamond: Gem,
  };
  const LevelIcon = levelIcons[levelInfo.level] || Award;

  const sizeClasses = {
    sm: {
      container: "p-3",
      icon: "text-2xl",
      title: "text-xs",
      name: "text-sm",
      points: "text-xs",
    },
    md: {
      container: "p-4",
      icon: "text-3xl",
      title: "text-sm",
      name: "text-base",
      points: "text-sm",
    },
    lg: {
      container: "p-6",
      icon: "text-4xl",
      title: "text-base",
      name: "text-xl",
      points: "text-base",
    },
  };

  const classes =
    size === "sm"
      ? sizeClasses.sm
      : size === "lg"
        ? sizeClasses.lg
        : sizeClasses.md;

  return (
    <Card
      className={`${classes.container} bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20`}
      style={{
        background: `linear-gradient(135deg, ${levelInfo.color}15 0%, ${levelInfo.color}05 100%)`,
        borderColor: `${levelInfo.color}40`,
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="flex items-center justify-center w-12 h-12 rounded-full"
          style={{ backgroundColor: `${levelInfo.color}20` }}
        >
          <LevelIcon className={`${classes.icon} text-current`} aria-hidden="true" />
        </div>
        <div className="flex-1">
          <p className={`${classes.title} text-muted-foreground font-medium`}>
            Nível Atual
          </p>
          <p
            className={`${classes.name} font-bold`}
            style={{ color: levelInfo.color }}
          >
            {levelInfo.name}
          </p>
        </div>
        <div className="text-right">
          <p className={`${classes.title} text-muted-foreground`}>Pontos</p>
          <p className={`${classes.points} font-bold`}>{totalPoints}</p>
        </div>
      </div>

      {showProgress && levelInfo.level !== "diamond" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progresso para {levelInfo.nextLevel}</span>
            <span className="font-medium">{levelInfo.progress}%</span>
          </div>
          <Progress
            value={levelInfo.progress}
            className="h-2"
            style={{
              backgroundColor: `${levelInfo.color}20`,
            }}
          />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>
              Faltam {levelInfo.nextLevelPoints - totalPoints} pontos para{" "}
              {levelInfo.nextLevel}
            </span>
          </div>
        </div>
      )}

      {levelInfo.level === "diamond" && (
        <div className="text-center py-2">
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Nível máximo alcançado
          </p>
        </div>
      )}
    </Card>
  );
}
