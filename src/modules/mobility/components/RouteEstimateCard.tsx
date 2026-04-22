import { Clock3, MapPinned, Wallet } from "lucide-react";

interface RouteFare {
  base: number;
  distance: number;
  time: number;
  total: number;
  formatted: string;
}

interface RouteEstimate {
  distance: number;
  duration: number;
  price: number;
  eta?: string;
  fare?: RouteFare;
}

interface RouteEstimateCardProps {
  estimate: RouteEstimate;
  variant?: "compact" | "default";
}

export function RouteEstimateCard({ estimate, variant = "default" }: RouteEstimateCardProps) {
  const compact = variant === "compact";

  return (
    <div
      className={`rounded-xl border border-border bg-card ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <MapPinned className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-[10px] text-muted-foreground">Distância</p>
            <p className="text-xs font-semibold">{estimate.distance.toFixed(1)} km</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-[10px] text-muted-foreground">Tempo</p>
            <p className="text-xs font-semibold">{estimate.duration} min</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-[10px] text-muted-foreground">Estimativa</p>
            <p className="text-xs font-semibold">
              {estimate.fare?.formatted ?? `R$ ${estimate.price.toFixed(2)}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

