import React, { useMemo } from "react";
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
import { useCommunityLocation } from "../hooks/useCommunityLocation";
import { useTerritorialContextOptional } from "@/core/routing/components/TerritorialLayout";
import { getCityStateFromLocation, getCityStateFromResolved } from "@/core/location/utils/territoryHelpers";
import { LocationType } from "@/core/location/types";

interface TopUserItem {
  id: string;
  name: string;
  avatar_url?: string | null;
  reputation?: number | null;
}

export function TopUsersWidget() {
  const { filters } = useCommunityFilters();
  const territorialContext = useTerritorialContextOptional();
  const { activeLocation } = useCommunityLocation();

  const { city, neighborhood } = useMemo(() => {
    if (territorialContext?.resolved) {
      const cityState = getCityStateFromResolved(territorialContext.resolved);
      const neighborhoodName =
        filters.locationScope === "neighborhood" &&
        territorialContext.resolved.kind === "location" &&
        territorialContext.resolved.location.type === LocationType.DISTRICT
          ? territorialContext.resolved.location.name
          : null;

      return {
        city: cityState.city,
        neighborhood: neighborhoodName,
      };
    }

    if (activeLocation) {
      const cityState = getCityStateFromLocation(activeLocation);
      const neighborhoodName =
        filters.locationScope === "neighborhood" && activeLocation.type === LocationType.DISTRICT
          ? activeLocation.name
          : null;

      return {
        city: cityState.city,
        neighborhood: neighborhoodName,
      };
    }

    return { city: "", neighborhood: null as string | null };
  }, [territorialContext, activeLocation, filters.locationScope]);

  const { data: topUsers, isLoading } = useQuery<any>({
    queryKey: ["top-users", city, neighborhood],
    queryFn: async () => {
      return await GamificationService.getTopUsersByLocation(city, neighborhood, 5);
    },
    staleTime: 5 * 60 * 1000,
    enabled: city.length > 0,
  });

  const users = (topUsers ?? []) as TopUserItem[];
  if (isLoading || users.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          Usuarios Destaque
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.map((topUser, index: number) => (
          <div
            key={topUser.id}
            className="flex items-center gap-3 cursor-pointer hover:bg-accent p-2 rounded-md transition-colors"
          >
            <span className="text-xs font-bold text-muted-foreground w-4">
              #{index + 1}
            </span>
            <Avatar className="w-8 h-8">
              <AvatarImage src={topUser.avatar_url ?? undefined} />
              <AvatarFallback>{topUser.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{topUser.name}</p>
              <p className="text-xs text-muted-foreground">
                {topUser.reputation || 0} pontos
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
