import React, { useState } from "react";
import { XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import type { RideRequest } from "@/core/mobility/types";
import { StatusTimeline } from "../StatusTimeline";
import { RideTrackingMap } from "../RideTrackingMap";
import { RideCardHeader } from "./ride-card/RideCardHeader";
import { RideRoute } from "./ride-card/RideRoute";
import { RideInfo } from "./ride-card/RideInfo";
import { DriverInfo } from "./ride-card/DriverInfo";
import { OperationalPinCard } from "./OperationalPinCard";
import { getPassengerRideViewAvailability } from "@/core/mobility/core/PassengerRideViewPolicy";

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

  const shouldShowMapOption = Boolean(ride.driver && viewPolicy.showLiveMap);
  const showDriverInfo = Boolean(ride.driver && viewPolicy.showDriverInfo);
  const canCancel = viewPolicy.canCancel;

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 transition-all bg-card border-border",
      )}
    >
      <RideCardHeader status={ride.status} isEntrega={isEntrega} />

      <button
        onClick={() => setShowTimeline(!showTimeline)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors mb-4"
      >
        <span className="text-xs text-gray-400">Ver progresso da viagem</span>
        {showTimeline ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {showTimeline && (
        <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <StatusTimeline ride={ride} />
        </div>
      )}

      <RideRoute origin={ride.origin} destination={ride.destination} />

      <RideInfo
        departureTime={ride.departure_time}
        price={ride.suggested_price}
        paymentMethod={ride.payment_method}
        observation={ride.observation}
      />

      <OperationalPinCard rideId={ride.id} rideStatus={ride.status} />

      {showDriverInfo && ride.driver && (
        <DriverInfo
          driver={{
            name: ride.driver.name || "Motorista",
            vehicle_model: ride.driver.vehicle_model || "Veículo",
            vehicle_plate: ride.driver.vehicle_plate || "N/A",
            rating: ride.driver.rating || 0,
            total_rides: 0,
          }}
          ride={ride}
          shouldShowMapOption={shouldShowMapOption}
          showMap={showMap}
          onContact={onContact}
          onToggleMap={() => setShowMap(!showMap)}
        />
      )}

      {showMap && shouldShowMapOption && (
        <div className="mb-4 h-80 rounded-xl overflow-hidden border border-white/10">
          <RideTrackingMap
            driverProfileId={ride.driver?.id || ""}
            rideId={ride.id}
            originLat={ride.origin_lat}
            originLon={ride.origin_lng}
            destinationLat={ride.destination_lat}
            destinationLon={ride.destination_lng}
            showETA
          />
        </div>
      )}

      {canCancel && (
        <Button
          onClick={() => onCancel(ride.id)}
          variant="outline"
          className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-xs h-9"
        >
          <XCircle className="h-3.5 w-3.5 mr-1.5" /> Cancelar Pedido
        </Button>
      )}
    </div>
  );
}
