import { Clock, MapPin, Navigation, Store } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Card } from "@/shared/components/ui/card";
import type { NearbyBusiness } from "../domain/types";

interface NearbyCardProps {
  business: NearbyBusiness;
  onNavigate: (url: string) => void;
  showProximity: boolean;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function getWalkingTime(meters: number): string {
  const minutes = Math.round(meters / 83);
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

export function NearbyCard({
  business,
  onNavigate,
  showProximity,
}: NearbyCardProps) {
  const hasRealDistance =
    showProximity &&
    business.distanceMeters > 0 &&
    business.distanceMeters < 100000;
  const territoryName = business.neighborhood || business.city || "na região";

  return (
    <Card
      className="group cursor-pointer overflow-hidden border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
      onClick={() => onNavigate(business.canonicalUrl)}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="shrink-0 rounded-xl bg-blue-500 p-3 text-white shadow-sm">
            <Store className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 font-semibold text-foreground transition-colors group-hover:text-primary">
                {business.name}
              </h3>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {business.category || "Empresa"}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              {hasRealDistance ? (
                <>
                  <div className="flex items-center gap-1.5 font-semibold text-primary">
                    <Navigation className="h-4 w-4" />
                    <span>{formatDistance(business.distanceMeters)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{getWalkingTime(business.distanceMeters)}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{territoryName}</span>
                </div>
              )}

              {business.rating > 0 ? (
                <span className="text-xs text-muted-foreground">
                  {business.rating.toFixed(1)} / 5
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
