import React from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { DriverRidesList } from "./DriverRidesList";
import { RIDE_STATUS } from "@/shared/types/constants";

type OfferModeFilter = "all" | "ride" | "motoboy";

export interface MobilityRide {
  id: string;
  status: string;
  type?: string;
  ride_mode?: string | null;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  final_price?: number | null;
  actual_fare?: number | null;
  price?: number | null;
  suggested_price?: number | null;
  passenger?: {
    name?: string;
    rating?: number | null;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface DriverRidesTabProps {
  isDriverOnline: boolean;
  isTracking: boolean;
  gpsError: string | null;
  currentDriverId: string | null;
  acceptedRides: MobilityRide[];
  availableRides: MobilityRide[];
  loading: boolean;
  isSuspended?: boolean;
  canAcceptRideOffers: boolean;
  canAcceptDeliveryOffers: boolean;
  offerModeFilter: OfferModeFilter;
  onOfferModeFilterChange: (mode: OfferModeFilter) => void;
  onToggleOnline: () => void;
  onAcceptRide: (rideId: string) => void;
  onStartRide: (rideId: string) => void;
  onCompleteRide: (rideId: string, ride?: MobilityRide) => void;
  onCancelRide: (rideId: string) => void;
}

export function DriverRidesTab({
  acceptedRides,
  availableRides,
  loading,
  isSuspended = false,
  canAcceptRideOffers,
  canAcceptDeliveryOffers,
  offerModeFilter,
  onOfferModeFilterChange,
  onAcceptRide,
  onStartRide,
  onCompleteRide,
  onCancelRide,
}: DriverRidesTabProps) {
  const acceptedPassengerRides = acceptedRides.filter(
    (ride) => !(ride.ride_mode === "motoboy" || ride.type === "entrega"),
  );

  return (
    <div className="space-y-1.5">
      {acceptedPassengerRides.length > 0 && (
        <div>
          <h3 className="mb-1 flex items-center gap-1.5 text-xs font-bold text-foreground">
            <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
            Corridas Ativas ({acceptedPassengerRides.length})
          </h3>
          <DriverRidesList
            rides={acceptedPassengerRides}
            type={RIDE_STATUS.ACCEPTED}
            onStart={onStartRide}
            onComplete={onCompleteRide}
            onCancel={onCancelRide}
            loading={false}
          />
        </div>
      )}

      <div>
        <h3 className="mb-1 flex items-center gap-1.5 text-xs font-bold text-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          Pedidos Disponiveis ({availableRides.length})
        </h3>
        {canAcceptRideOffers && canAcceptDeliveryOffers && (
          <div className="mb-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={offerModeFilter === "all" ? "default" : "outline"}
              onClick={() => onOfferModeFilterChange("all")}
            >
              Todos
            </Button>
            <Button
              size="sm"
              variant={offerModeFilter === "ride" ? "default" : "outline"}
              onClick={() => onOfferModeFilterChange("ride")}
            >
              Corridas
            </Button>
            <Button
              size="sm"
              variant={offerModeFilter === "motoboy" ? "default" : "outline"}
              onClick={() => onOfferModeFilterChange("motoboy")}
            >
              Entregas
            </Button>
          </div>
        )}
        <DriverRidesList
          rides={availableRides}
          type="available"
          onAccept={onAcceptRide}
          loading={loading}
          isSuspended={isSuspended}
        />
      </div>
    </div>
  );
}
