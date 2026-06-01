import { Button } from "@/shared/components/ui/button";
import type { RideRequest } from "@/core/mobility/types";

interface RideRequestCardProps {
  ride: RideRequest;
  isDriver: boolean;
  onAccept: (id: string) => void;
}

export function RideRequestCard({ ride, isDriver, onAccept }: RideRequestCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-sm font-semibold text-foreground">
        {ride.origin ?? "Origem não informada"}
        {" -> "}
        {ride.destination ?? "Destino não informado"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {ride.type ?? "viagem"} • {ride.status ?? "pendente"}
      </p>
      {isDriver && (
        <Button size="sm" className="mt-3" onClick={() => onAccept(ride.id)}>
          Aceitar
        </Button>
      )}
    </div>
  );
}
