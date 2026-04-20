import React from "react";
import { Link } from "react-router-dom";
import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { TrendingUp } from "lucide-react";
import { useSessionContext } from "@/core/session";
import { WidgetSkeleton } from "./WidgetSkeleton";

/**
 * Widget de Perfil do Usuário na Sidebar
 * Mostra avatar, nome, nível, pontos e progresso
 */
export const UserProfileWidget = memo(() => {
  const { activeProfile, isLoading } = useSessionContext();

  if (isLoading) {
    return <WidgetSkeleton variant="profile" hasHeader={false} />;
  }

  if (!activeProfile) return null;

  const getInitials = (name?: string | null): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Cálculo de nível e progresso (exemplo)
  const points = 0; // pontos não existe em SessionProfileView (campo legado de gamificação ainda não migrado)
  const level = Math.floor(points / 100) + 1;
  const pointsInLevel = points % 100;
  const progressPercent = pointsInLevel;

  return (
    <Link
      to="/perfil"
      className="block bg-card rounded-lg p-3 border border-border hover:border-primary/50 transition-all duration-200 hover:shadow-lg group"
    >
      <div className="flex items-start gap-2.5">
        {/* Avatar com Badge de Nível */}
        <div className="relative flex-shrink-0">
          <Avatar className="h-11 w-11 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
            <AvatarImage src={activeProfile.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {getInitials(activeProfile.displayName)}
            </AvatarFallback>
          </Avatar>
          <Badge 
            variant="secondary" 
            className="absolute -bottom-0.5 -right-0.5 h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground"
          >
            {level}
          </Badge>
        </div>

        {/* Info do Usuário */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors leading-tight">
            {activeProfile.displayName || "Usuário"}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-primary flex-shrink-0" />
            <span className="text-xs text-muted-foreground">
              {points.toLocaleString()} pontos
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="mt-2.5 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Nível {level}</span>
          <span className="text-muted-foreground">{pointsInLevel}/100</span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>
    </Link>
  );
});

UserProfileWidget.displayName = "UserProfileWidget";
