import { useState } from "react";
import { ChevronDown, ChevronUp, XCircle } from "lucide-react";

import { getPassengerRideViewAvailability } from "@/core/mobility/core/PassengerRideViewPolicy";
import type { RideRequest } from "@/core/mobility/types";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { RideTrackingMap } from "../RideTrackingMap";
import { StatusTimeline } from "../StatusTimeline";
import { OperationalPinCard } from "./OperationalPinCard";
import { DriverInfo } from "./ride-card/DriverInfo";
import { RideCardHeader } from "./ride-card/RideCardHeader";
import { RideInfo } from "./ride-card/RideInfo";
import { RideRoute } from "./ride-card/RideRoute";

interface ActiveRideCardProps {
  ride: RideRequest;
  onCancel: (id: string) => void;
  onContact: () => void;
}

export function ActiveRideCard({
  ride,
  onCancel,
  onContact,
}: ActiveRideCardProps) {
  const [showTimeline, setShowTimeline] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const isEntrega = ride.type === "entrega" || ride.type === "delivery";
  const viewPolicy = getPassengerRideViewAvailability(ride.status);
  const driverProfileId = ride.driver?.id || ride.driver_profile_id || null;

  const shouldShowMapOption = Boolean(
    driverProfileId && viewPolicy.showLiveMap,
  );
  const showDriverInfo = Boolean(ride.driver && viewPolicy.showDriverInfo);
  const canCancel = viewPolicy.canCancel;
  const timelineId = `ride-timeline-${ride.id}`;

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5")}>
      <RideCardHeader status={ride.status} isEntrega={isEntrega} />

      <Button
        type="button"
        variant="ghost"
        aria-expanded={showTimeline}
        aria-controls={timelineId}
        onClick={() => setShowTimeline((current) => !current)}
        className="mb-4 h-auto w-full justify-between rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground"
      >
        <span>Ver progresso da viagem</span>
        {showTimeline ? (
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        )}
      </Button>

      {showTimeline ? (
        <div
          id={timelineId}
          className="mb-4 rounded-xl border border-border bg-muted/30 p-4"
        >
          <StatusTimeline ride={ride} />
        </div>
      ) : null}

      <RideRoute origin={ride.origin} destination={ride.destination} />

      <RideInfo
        departureTime={ride.departure_time}
        price={ride.suggested_price}
        paymentMethod={ride.payment_method}
        observation={ride.observation}
      />

      <OperationalPinCard rideId={ride.id} rideStatus={ride.status} />

      {showDriverInfo && ride.driver ? (
        <DriverInfo
          driver={{
            name: ride.driver.name || "Motorista",
            vehicle_model: ride.driver.vehicle_model || "Veículo",
            vehicle_plate: ride.driver.vehicle_plate || "N/A",
            avatar_url: ride.driver.profile?.avatar_url ?? null,
            rating: ride.driver.rating ?? null,
            phone: ride.driver.phone ?? null,
          }}
          ride={ride}
          shouldShowMapOption={shouldShowMapOption}
          showMap={showMap}
          onContact={onContact}
          onToggleMap={() => setShowMap((current) => !current)}
        />
      ) : null}

      {showMap && shouldShowMapOption && driverProfileId ? (
        <div className="mb-4 h-80 overflow-hidden rounded-xl border border-border">
          <RideTrackingMap
            driverProfileId={driverProfileId}
            rideId={ride.id}
            originLat={ride.origin_lat}
            originLon={ride.origin_lng}
            destinationLat={ride.destination_lat}
            destinationLon={ride.destination_lng}
            showETA
          />
        </div>
      ) : null}

      {canCancel ? (
        <Button
          type="button"
          onClick={() => onCancel(ride.id)}
          variant="outline"
          className="h-9 w-full rounded-xl border-destructive/30 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <XCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {isEntrega ? "Cancelar entrega" : "Cancelar corrida"}
        </Button>
      ) : null}
    </div>
  );
}
