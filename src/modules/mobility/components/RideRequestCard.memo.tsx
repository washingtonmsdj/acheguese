/**
 * RideRequestCard - Versão Memoizada
 *
 * Componente otimizado com React.memo para evitar re-renders desnecessários
 * em listas de corridas.
 *
 * @module components/mobilidade/RideRequestCard
 * @version 2.0.0
 */

import React, { memo } from "react";
import {
  Car,
  Package,
  Clock,
  MapPin,
  DollarSign,
  User,
  Star,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { RIDE_STATUS } from "@/shared/types/constants";
import { cn } from "@/shared/utils/cn";
import type { RideRequest } from "@/modules/mobility/types";
import { StatusBadge } from "./StatusBadge";
import { PAYMENT_METHOD } from "@/shared/types/constants";
interface RideRequestCardProps {
  ride: RideRequest;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  accepting?: boolean;
  className?: string;
}

/**
 * Componente de card de solicitação de corrida
 * Memoizado para performance em listas grandes
 */
const RideRequestCardComponent = ({
  ride,
  onAccept,
  onReject,
  accepting = false,
  className,
}: RideRequestCardProps) => {
  const isEntrega = ride.type === "entrega";
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 transition-all bg-card border-border hover:border-primary/30",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <StatusBadge status={ride.status} size="sm" />
        <Badge
          className={cn(
            "text-[0.6rem] px-2 rounded-full",
            isEntrega
              ? "bg-amber-500/20 text-amber-400"
              : "bg-teal-400/20 text-teal-400",
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

      {/* Passenger Info */}
      {ride.passenger && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-secondary/50">
          <Avatar className="h-10 w-10 border-2 border-border">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-bold">
              {(ride.passenger?.name ?? '?').charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {ride.passenger.name}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">
                {ride.passenger.neighborhood || "Bairro não informado"}
              </span>
            </div>
          </div>
          {ride.passenger.pontos !== undefined && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-warning/10">
              <Star className="h-3 w-3 text-warning fill-warning" />
              <span className="text-xs font-bold text-warning">
                {ride.passenger.pontos}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Route */}
      <div className="flex items-start gap-3 mb-4">
        <div className="mt-1 flex flex-col items-center">
          <div className="w-3 h-3 rounded-full bg-teal-400 border-2 border-teal-400/30" />
          <div className="w-0.5 h-8 bg-gradient-to-b from-teal-400/50 to-amber-400/50" />
          <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-amber-400/30" />
        </div>
        <div className="flex-1 space-y-3 min-w-0">
          <div>
            <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">
              Origem
            </p>
            <p className="text-sm text-foreground font-medium truncate">
              {ride.origin}
            </p>
          </div>
          <div>
            <p className="text-[0.65rem] text-muted-foreground uppercase tracking-wider">
              Destino
            </p>
            <p className="text-sm text-foreground font-medium truncate">
              {ride.destination}
            </p>
          </div>
        </div>
      </div>

      {/* Info row */}
      <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span>{formatTime(ride.departure_time)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-success" />
          <span className="text-success font-bold text-sm">
            R$ {ride.suggested_price.toFixed(2)}
          </span>
        </div>
        {ride.payment_method && (
          <Badge className="bg-secondary text-muted-foreground text-[0.6rem] px-2 rounded-full border border-border">
            {ride.payment_method === PAYMENT_METHOD.PIX
              ? "💳 Pix"
              : "💵 Dinheiro"}
          </Badge>
        )}
      </div>

      {ride.observation && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-secondary/50 border border-border">
          <p className="text-xs text-muted-foreground italic">
            "{ride.observation}"
          </p>
        </div>
      )}

      {/* Actions */}
      {onAccept && ride.status === RIDE_STATUS.PENDING && (
        <div className="grid grid-cols-2 gap-2">
          {onReject && (
            <Button
              onClick={() => onReject(ride.id)}
              variant="outline"
              disabled={accepting}
              className="border-border text-muted-foreground hover:bg-secondary rounded-xl text-xs h-9"
            >
              Recusar
            </Button>
          )}
          <Button
            onClick={() => onAccept(ride.id)}
            disabled={accepting}
            className={cn(
              "bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs h-9 shadow-sm",
              !onReject && "col-span-2",
            )}
          >
            {accepting ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                Aceitando...
              </>
            ) : (
              <>
                <Car className="h-3.5 w-3.5 mr-1.5" />
                Aceitar Viagem
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

/**
 * Função de comparação para React.memo
 * Evita re-render se as props relevantes não mudaram
 */
const areEqual = (
  prevProps: RideRequestCardProps,
  nextProps: RideRequestCardProps,
) => {
  return (
    prevProps.ride.id === nextProps.ride.id &&
    prevProps.ride.status === nextProps.ride.status &&
    prevProps.ride.suggested_price === nextProps.ride.suggested_price &&
    prevProps.accepting === nextProps.accepting &&
    prevProps.className === nextProps.className
  );
};

/**
 * Exportar versão memoizada
 */
export const RideRequestCard = memo(RideRequestCardComponent, areEqual);

// Exportar também versão não-memoizada para casos específicos
export const RideRequestCardUnmemoized = RideRequestCardComponent;
