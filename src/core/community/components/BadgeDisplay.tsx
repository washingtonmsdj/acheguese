import { Award, Lock } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/utils/cn";

interface BadgeDisplayProps {
  badge: {
    code: string;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    category: string | null;
    earned_at?: string;
    progress?: number;
  };
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  locked?: boolean;
}

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-16 h-16",
  lg: "w-20 h-20",
};

const iconSizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

function getBadgeSizeClass(size: "sm" | "md" | "lg"): string {
  switch (size) {
    case "sm":
      return sizeClasses.sm;
    case "md":
      return sizeClasses.md;
    case "lg":
      return sizeClasses.lg;
    default:
      return sizeClasses.md;
  }
}

function getBadgeIconSizeClass(size: "sm" | "md" | "lg"): string {
  switch (size) {
    case "sm":
      return iconSizeClasses.sm;
    case "md":
      return iconSizeClasses.md;
    case "lg":
      return iconSizeClasses.lg;
    default:
      return iconSizeClasses.md;
  }
}

export function BadgeDisplay({
  badge,
  size = "md",
  showProgress = false,
  locked = false,
}: BadgeDisplayProps) {
  const isEarned = !!badge.earned_at;
  const progress = badge.progress || 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative inline-block">
            <div
              className={cn(
                "rounded-full flex items-center justify-center transition-all",
                getBadgeSizeClass(size),
                isEarned
                  ? "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg"
                  : locked
                    ? "bg-gray-200 dark:bg-gray-700"
                    : "bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600",
              )}
              style={
                isEarned && badge.color
                  ? { background: badge.color }
                  : undefined
              }
            >
              {locked ? (
                <Lock className={cn(getBadgeIconSizeClass(size), "text-gray-400")} />
              ) : badge.icon ? (
                <span
                  className={cn(
                    "text-2xl",
                    size === "sm" && "text-lg",
                    size === "lg" && "text-3xl",
                  )}
                >
                  {badge.icon}
                </span>
              ) : (
                <Award
                  className={cn(
                    getBadgeIconSizeClass(size),
                    isEarned ? "text-white" : "text-gray-400",
                  )}
                />
              )}
            </div>

            {showProgress && !isEarned && !locked && progress > 0 && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {progress}%
                </Badge>
              </div>
            )}

            {isEarned && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-semibold">{badge.name}</p>
            {badge.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {badge.description}
              </p>
            )}
            {badge.category && (
              <Badge variant="outline" className="mt-2 text-xs">
                {badge.category}
              </Badge>
            )}
            {isEarned && badge.earned_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Conquistado em{" "}
                {new Date(badge.earned_at).toLocaleDateString("pt-BR")}
              </p>
            )}
            {!isEarned && !locked && progress > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Progresso: {progress}%
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface BadgeGridProps {
  badges: BadgeDisplayProps["badge"][];
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  maxDisplay?: number;
}

export function BadgeGrid({
  badges,
  size = "md",
  showProgress = false,
  maxDisplay,
}: BadgeGridProps) {
  const displayBadges = maxDisplay ? badges.slice(0, maxDisplay) : badges;
  const remaining =
    maxDisplay && badges.length > maxDisplay ? badges.length - maxDisplay : 0;

  return (
    <div className="flex flex-wrap gap-3">
      {displayBadges.map((badge) => (
        <BadgeDisplay
          key={badge.code}
          badge={badge}
          size={size}
          showProgress={showProgress}
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800",
            getBadgeSizeClass(size),
          )}
        >
          <span className="text-sm font-semibold text-muted-foreground">
            +{remaining}
          </span>
        </div>
      )}
    </div>
  );
}
