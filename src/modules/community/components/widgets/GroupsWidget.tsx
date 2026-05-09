import React from "react";
import { Link } from "react-router-dom";
import { memo } from "react";
import { Users, Plus, ExternalLink, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { useAppUrls } from "@/core/routing/hooks";
import { useFavoriteGroups } from "../../hooks/useFavoriteGroups";
import { WidgetSkeleton } from "./WidgetSkeleton";

/**
 * Widget de Grupos Favoritos Melhorado
 * Mostra grupos com avatares maiores, badges e melhor hierarquia visual
 */
export const GroupsWidget = memo(() => {
  const { data: groups, isLoading } = useFavoriteGroups();
  const appUrls = useAppUrls();

  if (isLoading) {
    return <WidgetSkeleton hasHeader itemCount={3} />;
  }

  return (
    <div className="bg-card rounded-lg p-3 border border-border w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Users className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Meus Grupos
          </h3>
        </div>
        {groups && groups.length > 0 && (
          <Link
            to={appUrls.community.groups}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5 flex-shrink-0"
          >
            Ver todos
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Lista de Grupos */}
      <div className="space-y-1.5">
        {groups && groups.length > 0 ? (
          <>
            {groups.map((group, index) => {
              const isNew = index === 0; // Exemplo: primeiro grupo é "novo"
              
              return (
                <Link
                  key={group.id}
                  to={appUrls.community.groupDetail(group.id)}
                  className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group"
                >
                  {/* Avatar do Grupo */}
                  <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-border group-hover:ring-primary/30 transition-all">
                    {group.icon.startsWith('http') ? (
                      <AvatarImage src={group.icon} alt={group.name} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-base">
                        {group.icon}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  {/* Info do Grupo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                        {group.name}
                      </p>
                      {isNew && (
                        <Badge variant="secondary" className="h-3.5 px-1 text-[9px] bg-primary/20 text-primary flex-shrink-0">
                          <Sparkles className="h-2 w-2 mr-0.5" />
                          Novo
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <Users className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {group.members.toLocaleString()} membros
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-5 px-3">
            <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-2.5">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Você ainda não tem grupos favoritos
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs"
              asChild
            >
              <Link to={appUrls.community.groups}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Explorar Grupos
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* CTA para criar grupo */}
      {groups && groups.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2.5 h-8 text-xs"
          asChild
        >
          <Link to={appUrls.community.groups}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Criar Novo Grupo
          </Link>
        </Button>
      )}
    </div>
  );
});

GroupsWidget.displayName = "GroupsWidget";
