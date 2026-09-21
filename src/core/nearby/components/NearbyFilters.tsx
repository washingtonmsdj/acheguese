import { Navigation } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";

const RADIUS_OPTIONS = [
  { value: 1, label: "1km" },
  { value: 2, label: "2km" },
  { value: 5, label: "5km" },
  { value: 10, label: "10km" },
  { value: 20, label: "20km" },
];

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
        {RADIUS_OPTIONS.map((option) => (
          <Button
            key={option.value}
            size="sm"
            variant={radiusKm === option.value ? "default" : "outline"}
            onClick={() => onRadiusChange(option.value)}
            className="h-8 rounded-full px-3 text-xs"
          >
            {option.label}
          </Button>
        ))}
      </div>
      <Badge variant="secondary" className="ml-auto text-xs">
        {resultCount} empresa{resultCount !== 1 ? "s" : ""}
      </Badge>
    </div>
  );
}
