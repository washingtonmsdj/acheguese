import React from "react";
import { Link } from "react-router-dom";
import { memo } from "react";
import { Bell, MessageCircle, Heart, UserPlus, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { useTrendingTopics } from "../../hooks/useTrendingTopics";
import { useAppUrls } from "@/core/routing/hooks";

interface Activity {
  id: string;
  type: "comment" | "like" | "mention" | "follow";
  user: {
    name: string;
  };
  content: string;
  time: string;
  postId?: string;
}

export const ActivityWidget = memo(() => {
  const { data: topics = [] } = useTrendingTopics(4);
  const appUrls = useAppUrls();

  const activities: Activity[] = topics.map((topic, index) => ({
    id: topic.id,
    type: index % 2 === 0 ? "mention" : "comment",
    user: { name: "Comunidade" },
    content: `Tema ${topic.title} em alta`,
    time: `${topic.mentions} mencoes`,
  }));

  const getIcon = (type: Activity["type"]) => {
    switch (type) {
      case "comment": return <MessageCircle className="h-3.5 w-3.5" />;
      case "like": return <Heart className="h-3.5 w-3.5" />;
      case "mention": return <Bell className="h-3.5 w-3.5" />;
      case "follow": return <UserPlus className="h-3.5 w-3.5" />;
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (activities.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg p-3 border border-border w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Bell className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Atividades</h3>
        </div>
        <Link to="/notificacoes" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5 flex-shrink-0">
          Ver todas
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            to={activity.postId ? `${appUrls.community.feed}?post=${activity.postId}` : appUrls.notifications}
            className="flex items-start gap-2 p-2 rounded-lg hover:bg-secondary/50 transition-all duration-200 group"
          >
            <Avatar className="h-7 w-7 flex-shrink-0">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {getInitials(activity.user.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-1">
                <div className="flex-shrink-0 mt-0.5 text-muted-foreground">{getIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground leading-snug">
                    <span className="font-semibold">{activity.user.name}</span>{" "}
                    <span className="text-muted-foreground">{activity.content}</span>
                  </p>
                  <span className="text-[10px] text-muted-foreground mt-0.5 inline-block">{activity.time}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
});

ActivityWidget.displayName = "ActivityWidget";
