import React from "react";
import {
  MapPin,
  Clock,
  DollarSign,
  Package,
  Car,
  Star,
  ArrowRight,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import type { RideRequest } from "@/modules/mobility/types";
import { RIDE_STATUS } from "@/shared/types/constants";
import { cn } from "@/shared/utils/cn";

interface RideRequestCardProps {
  ride: RideRequest;
  onAccept?: (id: string) => void;
  isDriver?: boolean;
}

export function RideRequestCard({
  ride,
  onAccept,
  isDriver,
}: RideRequestCardProps) {
  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelative = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}min atrás`;
    return `${Math.floor(mins / 60)}h atrás`;
  };

  const isEntrega = ride.type === "entrega";
  const isPending = ride.status === RIDE_STATUS.PENDING;

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all hover:shadow-lg",
        "bg-card border-border hover:border-primary/30",
        !isPending && "opacity-70",
      )}
    >
      {/* Header: Passenger info */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="h-10 w-10 border-2 border-primary/30">
          <AvatarImage src={ride.passenger?.avatar_url} />
          <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-accent text-primary-foreground">
            {getInitials(ride.passenger?.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">
              {ride.passenger?.name}
            </span>
            {ride.passenger?.pontos && ride.passenger.pontos > 1000 && (
              <div className="flex items-center gap-0.5">
                <Star className="h-3 w-3 text-warning fill-warning" />
                <span className="text-[0.65rem] text-warning font-medium">
                  {ride.passenger.pontos}
                </span>
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {ride.passenger?.neighborhood} · {formatRelative(ride.created_at)}
          </span>
        </div>
        <Badge
          className={cn(
            "text-[0.6rem] font-semibold px-2 py-0.5 rounded-full",
            isEntrega
              ? "bg-warning/20 text-warning border border-warning/30"
              : "bg-primary/20 text-primary border border-primary/30",
          )}
        >
          {isEntrega ? (
            <Package className="h-3 w-3 mr-1" />
          ) : (
            <Car className="h-3 w-3 mr-1" />
          )}
          {isEntrega ? "Entrega" : "Viagem"}
        </Badge>
      </div>

      {/* Route */}
      <div className="space-y-2 mb-3">
        <div className="flex items-start gap-2">
          <div className="mt-1 flex flex-col items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-primary border-2 border-primary/30" />
            <div className="w-0.5 h-6 bg-gradient-to-b from-primary/50 to-warning/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-warning border-2 border-warning/30" />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Origem</p>
              <p className="text-sm text-foreground font-medium">
                {ride.origin}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Destino</p>
              <p className="text-sm text-foreground font-medium">
                {ride.destination}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info row */}
      <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span>{formatTime(ride.departure_time)}</span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="h-3.5 w-3.5 text-success" />
          <span className="text-success font-bold text-sm">
            R$ {ride.suggested_price.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Observation */}
      {ride.observation && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-secondary/50 border border-border">
          <p className="text-xs text-muted-foreground italic">
            "{ride.observation}"
          </p>
        </div>
      )}

      {/* Status / Action */}
      {isPending && isDriver ? (
        <Button
          onClick={() => onAccept?.(ride.id)}
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold rounded-xl h-10 shadow-lg shadow-primary/20"
        >
          <Car className="h-4 w-4 mr-2" />
          Aceitar Viagem
        </Button>
      ) : ride.status === RIDE_STATUS.DRIVER_ASSIGNED ||
        ride.status === RIDE_STATUS.DRIVER_ON_THE_WAY ||
        ride.status === RIDE_STATUS.DRIVER_ARRIVED ||
        ride.status === RIDE_STATUS.PASSENGER_ON_BOARD ||
        ride.status === RIDE_STATUS.IN_PROGRESS ? (
        <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-success/10 border border-success/20">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-success font-semibold">
            Em andamento
          </span>
        </div>
      ) : ride.status === RIDE_STATUS.COMPLETED ? (
        <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-secondary/50 border border-border">
          <span className="text-xs text-muted-foreground">Concluída</span>
        </div>
      ) : null}
    </div>
  );
}
