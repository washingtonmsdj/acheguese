import { MapPin, Navigation, Store } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Card } from "@/shared/components/ui/card";
import type { NearbyBusiness } from "../domain/types";
import { isPreciseNearbyDistance } from "../config/nearbyConfig";
import { formatNearbyDistance } from "../utils/nearbyDistance";

interface NearbyCardProps {
  business: NearbyBusiness;
  onNavigate: (url: string) => void;
  showProximity: boolean;
}


export function NearbyCard({
  business,
  onNavigate,
  showProximity,
}: NearbyCardProps) {
  const hasRealDistance = isPreciseNearbyDistance(business.distanceMeters, showProximity);
  const territoryName = business.neighborhood || business.city || "na região";

  return (
    <Card
      className="group cursor-pointer overflow-hidden border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-lg"
      onClick={() => onNavigate(business.canonicalUrl)}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="shrink-0 rounded-xl bg-primary p-3 text-primary-foreground shadow-sm">
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
                    <span>{formatNearbyDistance(business.distanceMeters)} em linha reta</span>
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
