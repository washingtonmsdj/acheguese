import React from "react";

import { useQuery } from "@tanstack/react-query";
import { GamificationService } from "@/core/gamification/services/GamificationService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Trophy } from "lucide-react";
import { useCommunityFilters } from "../hooks/feed/useFeedFilters";
import { useAuth } from "@/core/auth/hooks/useAuth";

export function TopUsersWidget() {
  const { filters } = useCommunityFilters();
  const { user } = useAuth();

  const userLocation = {
    city: user?.user_metadata?.city || "",
    neighborhood: user?.user_metadata?.neighborhood || "",
    street: user?.user_metadata?.street || "",
  };

  const { data: topUsers, isLoading } = useQuery({
    queryKey: ["top-users", filters.locationScope, userLocation],
    queryFn: async () => {
      // ✅ SSOT - Usar GamificationService
      return await GamificationService.getTopUsersByLocation(
        userLocation.city,
        filters.locationScope === "neighborhood"
          ? userLocation.neighborhood
          : null,
        5,
      );
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!userLocation.city,
  });

  if (isLoading || !topUsers || topUsers.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          Usuários Destaque
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topUsers.map((user: any, index: number) => (
          <div
            key={user.id}
            className="flex items-center gap-3 cursor-pointer hover:bg-accent p-2 rounded-md transition-colors"
          >
            <span className="text-xs font-bold text-muted-foreground w-4">
              #{index + 1}
            </span>
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback>{user.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground">
                {user.reputation || 0} pontos
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
