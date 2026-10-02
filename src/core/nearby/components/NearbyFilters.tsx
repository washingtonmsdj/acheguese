import { Navigation } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { NEARBY_RADIUS_OPTIONS_KM } from "../config/nearbyConfig";
import { formatNearbyDistance } from "../utils/nearbyDistance";


interface NearbyFiltersProps {
  radiusKm: number;
  onRadiusChange: (radiusKm: number) => void;
  resultCount: number;
  showProximity: boolean;
}

export function NearbyFilters({
  radiusKm,
  onRadiusChange,
  resultCount,
  showProximity,
}: NearbyFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="rounded-lg bg-primary/10 p-1.5">
        <Navigation className="h-4 w-4 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground">
        {showProximity ? "Raio:" : "Recorte a partir do centro:"}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {NEARBY_RADIUS_OPTIONS_KM.map((radiusKmOption) => (
          <Button
            key={radiusKmOption}
            size="sm"
            variant={radiusKm === radiusKmOption ? "default" : "outline"}
            onClick={() => onRadiusChange(radiusKmOption)}
            className="h-8 rounded-full px-3 text-xs"
          >
            {formatNearbyDistance(radiusKmOption * 1000)}
          </Button>
        ))}
      </div>
      <Badge variant="secondary" className="ml-auto text-xs">
        {resultCount} empresa{resultCount !== 1 ? "s" : ""}
      </Badge>
    </div>
  );
}
