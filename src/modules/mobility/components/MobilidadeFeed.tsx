import React from "react";
import { RideRequestCard } from "./index";
import { Car, Package, Loader2 } from "lucide-react";
import type { RideRequest } from "@/core/mobility/types";

interface MobilidadeFeedProps {
  rides: RideRequest[];
  loading: boolean;
  isDriver: boolean;
  onAcceptRide: (id: string) => void;
}

export function MobilidadeFeed({
  rides,
  loading,
  isDriver,
  onAcceptRide,
}: MobilidadeFeedProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (rides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
          <Car className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Nenhum pedido encontrado
        </h3>
        <p className="text-xs text-muted-foreground max-w-[250px]">
          Não há pedidos de viagem ou entrega no momento. Crie um novo pedido!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rides.map((ride) => (
        <RideRequestCard
          key={ride.id}
          ride={ride}
          isDriver={isDriver}
          onAccept={onAcceptRide}
        />
      ))}
    </div>
  );
}
