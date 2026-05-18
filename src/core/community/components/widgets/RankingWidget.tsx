import React from "react";
import { Link } from "react-router-dom";
import { memo } from "react";
import { Trophy, TrendingUp, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { useRankingUsers } from "../../hooks/useRankingUsers";
import { WidgetSkeleton } from "./WidgetSkeleton";
import { useSessionContext } from "@/core/session";
import { useAppUrls } from "@/core/routing/hooks";

/**
 * Widget de Ranking Melhorado
 * Mostra top 3 usuários com medalhas e destaque para usuário atual
 */
export const RankingWidget = memo(() => {
  const { data: users, isLoading } = useRankingUsers(5);
  const { activeProfile } = useSessionContext();
  const appUrls = useAppUrls();

  if (isLoading) {
    return <WidgetSkeleton hasHeader itemCount={3} />;
  }

  if (!users || users.length === 0) {
    return null;
  }

  const getMedal = (position: number) => {
    switch (position) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return null;
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-card rounded-lg p-3 border border-border w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Trophy className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Top Vizinhos
          </h3>
        </div>
        <Link 
          to={appUrls.ranking}
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5 flex-shrink-0"
        >
          Ver todos
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Lista de Usuários */}
      <div className="space-y-1.5">
        {users.map((user) => {
          const isCurrentUser = activeProfile?.id === user.id;
          const medal = getMedal(user.position);
          
          return (
            <Link
              key={user.id}
              to={appUrls.profile.public(user.id)}
              className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${
                isCurrentUser 
                  ? "bg-primary/10 border border-primary/30" 
                  : "bg-secondary/50 hover:bg-secondary"
              }`}
            >
              {/* Posição ou Medalha */}
              <div className="flex-shrink-0 w-7 h-7 rounded-md bg-background flex items-center justify-center font-bold text-xs">
                {medal || user.position}
              </div>

              {/* Avatar */}
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarImage src={(user as { avatar_url?: string; avatarUrl?: string }).avatar_url || (user as { avatar_url?: string; avatarUrl?: string }).avatarUrl || undefined} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate leading-tight ${
                  isCurrentUser ? "text-primary" : "text-foreground"
                }`}>
                  {user.name}
                  {isCurrentUser && (
                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                      (você)
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-0.5 mt-0.5">
                  <TrendingUp className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    {user.points.toLocaleString()} pts
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* CTA para ver ranking completo */}
      <Button
        variant="outline"
        size="sm"
        className="w-full mt-2.5 h-8 text-xs"
        asChild
      >
        <Link to={appUrls.ranking}>
          Ver Ranking Completo
        </Link>
      </Button>
    </div>
  );
});

RankingWidget.displayName = "RankingWidget";
