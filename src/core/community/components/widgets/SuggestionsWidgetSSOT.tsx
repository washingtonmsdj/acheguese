import React, { memo } from "react";
import { Link } from "react-router-dom";
import { Lightbulb, Users, Calendar, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { useFavoriteGroups } from "@/core/community-groups/hooks/useFavoriteGroups";
import { useTrendingTopics } from "../../hooks/useTrendingTopics";
import { useAppUrls } from "@/core/routing/hooks";
import { buildPublicProfileUrl } from "@/core/profiles/utils/publicProfileUrl";

interface Suggestion {
  id: string;
  type: "group" | "event" | "person";
  name: string;
  username?: string | null;
  description: string;
  icon?: string;
  trending?: boolean;
}

export const SuggestionsWidgetSSOT = memo(() => {
  const { data: groups = [] } = useFavoriteGroups();
  const { data: topics = [] } = useTrendingTopics(3);
  const appUrls = useAppUrls();

  const suggestions: Suggestion[] = [
    ...groups.slice(0, 2).map((group) => ({
      id: group.id,
      type: "group" as const,
      name: group.name,
      description: `${group.members} membros`,
      icon: group.icon,
    })),
    ...topics.slice(0, 2).map((topic) => ({
      id: topic.id,
      type: "event" as const,
      name: topic.title,
      description: `${topic.mentions} mencoes`,
      trending: true,
    })),
  ];

  const getIcon = (type: Suggestion["type"]) => {
    switch (type) {
      case "group":
        return <Users className="h-3.5 w-3.5" />;
      case "event":
        return <Calendar className="h-3.5 w-3.5" />;
      case "person":
        return <Users className="h-3.5 w-3.5" />;
    }
  };

  const getLink = (suggestion: Suggestion) => {
    switch (suggestion.type) {
      case "group":
        return appUrls.community.groupDetail(suggestion.id);
      case "event":
        return appUrls.community.feed;
      case "person":
        return suggestion.username ? buildPublicProfileUrl(suggestion.username) : appUrls.search;
    }
  };

  const getInitials = (name: string): string =>
    name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg p-3 border border-border w-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Sugestoes</h3>
      </div>

      <div className="space-y-1.5">
        {suggestions.map((suggestion) => (
          <div
            key={`${suggestion.type}-${suggestion.id}`}
            className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-200 group"
          >
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                {suggestion.icon || getInitials(suggestion.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-foreground truncate leading-tight">
                  {suggestion.name}
                </p>
                {suggestion.trending && (
                  <Badge
                    variant="secondary"
                    className="h-3.5 px-1 text-[9px] bg-orange-500/20 text-orange-500 flex-shrink-0"
                  >
                    <TrendingUp className="h-2 w-2 mr-0.5" />
                    Em alta
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-0.5 mt-0.5">
                {getIcon(suggestion.type)}
                <span className="text-[10px] text-muted-foreground">{suggestion.description}</span>
              </div>
            </div>

            <Button variant="ghost" size="sm" className="h-7 px-2.5 text-[11px] flex-shrink-0" asChild>
              <Link to={getLink(suggestion)}>{suggestion.type === "person" ? "Seguir" : "Ver"}</Link>
            </Button>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" className="w-full mt-2.5 h-8 text-xs" asChild>
        <Link to={appUrls.search}>Explorar Mais</Link>
      </Button>
    </div>
  );
});

SuggestionsWidgetSSOT.displayName = "SuggestionsWidgetSSOT";
