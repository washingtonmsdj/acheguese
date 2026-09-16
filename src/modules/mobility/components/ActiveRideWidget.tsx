/**
 * Widget de corrida ativa.
 * Exibe o resumo operacional usando o lifecycle e os tokens canônicos de Mobilidade.
 */

import { memo, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Car, MapPin, Star } from "lucide-react";
import { motion } from "framer-motion";

import { RIDE_STATUS, RIDE_STATUS_LABELS } from "@/core/mobility/constants";
import { mobilityRoutes } from "@/core/mobility/routes/mobilityRoutes";
import type { RideRequest } from "@/core/mobility/types/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn";
import { formatBrl } from "@/shared/utils/currency";

interface ActiveRideWidgetProps {
  ride: RideRequest;
  isDriver?: boolean;
  compact?: boolean;
  className?: string;
}

const SUCCESS_STATUSES = new Set<string>([
  RIDE_STATUS.COMPLETED,
  RIDE_STATUS.DELIVERED,
]);

const DESTRUCTIVE_STATUSES = new Set<string>([
  RIDE_STATUS.CANCELLED,
  RIDE_STATUS.CANCELLED_BY_DRIVER,
  RIDE_STATUS.CANCELLED_BY_PASSENGER,
  RIDE_STATUS.FAILED,
  RIDE_STATUS.FAILED_DELIVERY,
]);

const WARNING_STATUSES = new Set<string>([
  RIDE_STATUS.PENDING,
  RIDE_STATUS.REQUESTED,
  RIDE_STATUS.SEARCHING_DRIVER,
  RIDE_STATUS.EXPIRED,
]);

const INFO_STATUSES = new Set<string>([
  RIDE_STATUS.DRIVER_ASSIGNED,
  RIDE_STATUS.DRIVER_ACCEPTED,
  RIDE_STATUS.DRIVER_ARRIVING,
  RIDE_STATUS.DRIVER_ON_THE_WAY,
  RIDE_STATUS.DRIVER_ARRIVED,
]);

const ACTIVE_EXECUTION_STATUSES = new Set<string>([
  RIDE_STATUS.PASSENGER_BOARDED,
  RIDE_STATUS.PASSENGER_ON_BOARD,
  RIDE_STATUS.IN_PROGRESS,
  RIDE_STATUS.PICKUP_CONFIRMED,
  RIDE_STATUS.IN_DELIVERY,
]);

function getStatusClasses(status: string): string {
  if (SUCCESS_STATUSES.has(status)) {
    return "border-success/30 bg-success/10 text-success";
  }
  if (DESTRUCTIVE_STATUSES.has(status)) {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }
  if (WARNING_STATUSES.has(status)) {
    return "border-warning/30 bg-warning/10 text-warning";
  }
  if (INFO_STATUSES.has(status)) {
    return "border-info/30 bg-info/10 text-info";
  }
  if (ACTIVE_EXECUTION_STATUSES.has(status)) {
    return "border-category-mobility/30 bg-category-mobility/10 text-category-mobility";
  }
  return "border-border bg-muted/50 text-muted-foreground";
}

function getStatusLabel(status: string): string {
  return RIDE_STATUS_LABELS[status] ?? "Status em atualização";
}

export const ActiveRideWidget = memo(
  ({
    ride,
    isDriver = false,
    compact = false,
    className,
  }: ActiveRideWidgetProps) => {
    const navigate = useNavigate();
    const statusLabel = getStatusLabel(ride.status);
    const statusClasses = getStatusClasses(ride.status);
    const otherPerson = isDriver ? ride.passenger : ride.driver;
    const otherPersonName = isDriver
      ? ride.passenger?.name || "Passageiro"
      : ride.driver?.name || "Motorista";
    const destination =
      ride.destination_details || ride.destination || ride.destination_address;
    const origin = ride.origin_details || ride.origin || ride.origin_address;

    const handleClick = () => {
      navigate(
        isDriver
          ? mobilityRoutes.motorista.home
          : mobilityRoutes.passageiro.home,
      );
    };

    const handleCompactKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      handleClick();
    };

    if (compact) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("w-full", className)}
        >
          <Card
            role="button"
            tabIndex={0}
            aria-label={`Abrir detalhes da corrida: ${statusLabel}`}
            className="cursor-pointer border-category-mobility/30 bg-category-mobility/5 transition-colors hover:bg-category-mobility/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={handleClick}
            onKeyDown={handleCompactKeyDown}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-category-mobility/12 text-category-mobility">
                  <Car className="h-6 w-6" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn("text-xs", statusClasses)}
                    >
                      {statusLabel}
                    </Badge>
                  </div>
                  <p className="truncate text-sm font-medium text-foreground">
                    {destination}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {isDriver ? "Passageiro" : "Motorista"}: {otherPersonName}
                  </p>
                </div>

                <ArrowRight
                  className="h-5 w-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("w-full", className)}
      >
        <Card className="border-category-mobility/30 bg-category-mobility/5">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-category-mobility/12 text-category-mobility">
                  <Car className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {isDriver ? "Corrida em andamento" : "Sua viagem"}
                  </h3>
                  <Badge
                    variant="outline"
                    className={cn("mt-1 text-xs", statusClasses)}
                  >
                    {statusLabel}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mb-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-info/10 text-info">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-0.5 text-xs text-muted-foreground">Origem</p>
                  <p className="truncate text-sm text-foreground">{origin}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-category-mobility/12 text-category-mobility">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mb-0.5 text-xs text-muted-foreground">Destino</p>
                  <p className="truncate text-sm text-foreground">{destination}</p>
                </div>
              </div>
            </div>

            {otherPerson ? (
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <Avatar className="h-10 w-10 border-2 border-category-mobility/30">
                  <AvatarImage
                    src={
                      isDriver
                        ? ride.passenger?.avatar_url ?? undefined
                        : ride.driver?.profile?.avatar_url ?? undefined
                    }
                    alt={otherPersonName}
                  />
                  <AvatarFallback className="bg-category-mobility/12 text-xs font-semibold text-category-mobility">
                    {otherPersonName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {otherPersonName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isDriver ? "Passageiro" : "Motorista"}
                    {!isDriver && ride.driver?.vehicle_model
                      ? ` · ${ride.driver.vehicle_model}`
                      : ""}
                  </p>
                </div>
                {!isDriver && typeof ride.driver?.rating === "number" ? (
                  <div className="flex items-center gap-1 text-warning">
                    <span className="text-sm font-medium">
                      {ride.driver.rating.toFixed(1)}
                    </span>
                    <Star
                      className="h-3 w-3 fill-warning"
                      aria-hidden="true"
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {ride.final_price != null ? (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                <span className="text-sm text-muted-foreground">Valor</span>
                <span className="text-lg font-bold text-success">
                  {formatBrl(ride.final_price)}
                </span>
              </div>
            ) : null}

            <Button onClick={handleClick} className="w-full">
              Ver detalhes
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  },
);

ActiveRideWidget.displayName = "ActiveRideWidget";
