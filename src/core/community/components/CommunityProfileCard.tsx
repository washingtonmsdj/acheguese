import { MapPin, Award, TrendingUp, CheckCircle } from "lucide-react";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { BadgeGrid } from "./BadgeDisplay";
import { useCommunityProfile } from "@/core/community/hooks/useCommunityProfile";
import { Skeleton } from "@/shared/components/ui/skeleton";

interface CommunityProfileCardProps {
  compact?: boolean;
}

export function CommunityProfileCard({
  compact = false,
}: CommunityProfileCardProps) {
  const { profile, badges, stats, loading } = useCommunityProfile();
  const publicLocationLabel = [
    profile?.public_neighborhood ?? null,
    profile?.public_city ?? null,
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(", ");

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Perfil comunitário não encontrado
        </p>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback>
              {profile.display_name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{profile.display_name}</h3>
              {profile.verified_resident && (
                <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
              )}
            </div>
            {publicLocationLabel && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {publicLocationLabel}
              </p>
            )}
          </div>

          {badges.length > 0 && (
            <Badge variant="secondary" className="flex-shrink-0">
              <Award className="h-3 w-3 mr-1" />
              {badges.length}
            </Badge>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4 mb-6">
        <Avatar className="w-20 h-20">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className="text-2xl">
            {profile.display_name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold">{profile.display_name}</h2>
            {profile.verified_resident && (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Verificado
              </Badge>
            )}
          </div>

          {publicLocationLabel && (
            <p className="text-muted-foreground flex items-center gap-1 mb-2">
              <MapPin className="h-4 w-4" />
              {publicLocationLabel}
            </p>
          )}

          {profile.bio && (
            <p className="text-sm text-muted-foreground">{profile.bio}</p>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-2xl font-bold">{stats.total_points}</span>
          </div>
          <p className="text-xs text-muted-foreground">Pontos</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Award className="h-4 w-4 text-yellow-500" />
            <span className="text-2xl font-bold">{stats.badges_count}</span>
          </div>
          <p className="text-xs text-muted-foreground">Badges</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="text-2xl font-bold">
              {stats.total_interactions}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Interações</p>
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Conquistas</h3>
          <BadgeGrid badges={badges} size="md" maxDisplay={6} />
        </div>
      )}

      {badges.length === 0 && (
        <div className="text-center py-4">
          <Award className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhuma conquista ainda
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Interaja com a comunidade para ganhar badges!
          </p>
        </div>
      )}
    </Card>
  );
}
