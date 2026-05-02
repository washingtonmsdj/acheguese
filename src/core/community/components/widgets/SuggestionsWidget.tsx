import React from "react";
import { Link } from "react-router-dom";
import { memo } from "react";
import { Lightbulb, Users, Calendar, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";

/**
 * Widget de Sugestões
 * Mostra grupos, eventos e pessoas sugeridas baseado em interesses
 */

interface Suggestion {
  id: string;
  type: "group" | "event" | "person";
  name: string;
  description: string;
  icon?: string;
  members?: number;
  date?: string;
  trending?: boolean;
}

// TODO: Implementar hook para buscar sugestões reais do Supabase
const mockSuggestions: Suggestion[] = [];

export const SuggestionsWidget = memo(() => {
  const suggestions = mockSuggestions;

  const getIcon = (type: Suggestion["type"]) => {
    switch (type) {
      case "group": return <Users className="h-3.5 w-3.5" />;
      case "event": return <Calendar className="h-3.5 w-3.5" />;
      case "person": return <Users className="h-3.5 w-3.5" />;
    }
  };

  const getLink = (suggestion: Suggestion) => {
    switch (suggestion.type) {
      case "group": return `/comunidade/grupos/${suggestion.id}`;
      case "event": return `/eventos/${suggestion.id}`;
      case "person": return `/profile/${suggestion.id}`;
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

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg p-3 border border-border w-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          Sugestões
        </h3>
      </div>

      {/* Lista de Sugestões */}
      <div className="space-y-1.5">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-200 group"
          >
            {/* Avatar/Icon */}
            <Avatar className="h-9 w-9 flex-shrink-0">
              {suggestion.icon ? (
                <AvatarFallback className="bg-primary/10 text-base">
                  {suggestion.icon}
                </AvatarFallback>
              ) : (
                <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                  {getInitials(suggestion.name)}
                </AvatarFallback>
              )}
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-foreground truncate leading-tight">
                  {suggestion.name}
                </p>
                {suggestion.trending && (
                  <Badge variant="secondary" className="h-3.5 px-1 text-[9px] bg-orange-500/20 text-orange-500 flex-shrink-0">
                    <TrendingUp className="h-2 w-2 mr-0.5" />
                    Em alta
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-0.5 mt-0.5">
                {getIcon(suggestion.type)}
                <span className="text-[10px] text-muted-foreground">
                  {suggestion.description}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-[11px] flex-shrink-0"
              asChild
            >
              <Link to={getLink(suggestion)}>
                {suggestion.type === "person" ? "Seguir" : "Ver"}
              </Link>
            </Button>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Button
        variant="outline"
        size="sm"
        className="w-full mt-2.5 h-8 text-xs"
        asChild
      >
        <Link to="/explorar">
          Explorar Mais
        </Link>
      </Button>
    </div>
  );
});

SuggestionsWidget.displayName = "SuggestionsWidget";
