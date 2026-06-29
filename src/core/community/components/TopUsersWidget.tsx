import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { GamificationService } from "@/core/gamification/services/GamificationService";
import type { TopUserByLocation } from "@/core/gamification/services/GamificationService";
import { useTerritorialContextOptional } from "@/core/routing/components/TerritorialLayout";
import { LocationType } from "@/core/location/types";
import {
  getCityStateFromLocation,
  getCityStateFromResolved,
} from "@/core/location/utils/territoryHelpers";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { useCommunityFilters } from "../hooks/feed/useFeedFilters";
import { useCommunityLocation } from "../hooks/useCommunityLocation";

interface TopUserItem {
  id: string;
  name: string;
  avatar_url?: string | null;
  reputation?: number | null;
}

function normalizeTopUser(input: TopUserByLocation): TopUserItem | null {
  const id = typeof input.id === "string" ? input.id : null;
  const name = typeof input.name === "string" ? input.name : null;

  if (!id || !name) return null;

  return {
    id,
    name,
    avatar_url: typeof input.avatar_url === "string" ? input.avatar_url : null,
    reputation: typeof input.reputation === "number" ? input.reputation : 0,
  };
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
        (territorialContext.resolved.location.type === LocationType.NEIGHBORHOOD ||
          territorialContext.resolved.location.type === LocationType.DISTRICT)
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
        filters.locationScope === "neighborhood" &&
        (activeLocation.type === LocationType.NEIGHBORHOOD ||
          activeLocation.type === LocationType.DISTRICT)
          ? activeLocation.name
          : null;

      return {
        city: cityState.city,
        neighborhood: neighborhoodName,
      };
    }

    return { city: "", neighborhood: null as string | null };
  }, [territorialContext, activeLocation, filters.locationScope]);

  const { data: topUsers = [], isLoading } = useQuery<TopUserItem[]>({
    queryKey: ["top-users", city, neighborhood],
    queryFn: async () => {
      const data = await GamificationService.getTopUsersByLocation(city, neighborhood, 5);
      return data
        .map((item) => normalizeTopUser(item))
        .filter((item): item is TopUserItem => item !== null);
    },
    staleTime: 5 * 60 * 1000,
    enabled: city.length > 0,
  });

  if (isLoading || topUsers.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Usuarios em destaque
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topUsers.map((topUser, index) => (
          <div
            key={topUser.id}
            className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-accent"
          >
            <span className="w-4 text-xs font-bold text-muted-foreground">#{index + 1}</span>
            <Avatar className="h-8 w-8">
              <AvatarImage src={topUser.avatar_url ?? undefined} />
              <AvatarFallback>{topUser.name[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{topUser.name}</p>
              <p className="text-xs text-muted-foreground">{topUser.reputation ?? 0} pontos</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
