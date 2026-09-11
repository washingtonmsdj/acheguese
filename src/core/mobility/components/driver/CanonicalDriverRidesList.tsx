import type { MobilityRide } from "@/core/mobility/types/ride";
import { getDriverRideActionAvailability } from "@/core/mobility/core/DriverRideActionPolicy";
import { DriverPassengerRideProgression } from "./DriverPassengerRideProgression";
import { DriverRidesList } from "./DriverRidesList";

interface CanonicalDriverRidesListProps {
  rides: MobilityRide[];
  type: "available" | "accepted" | "history";
  onAccept?: (id: string) => void;
  onStartPickupRoute?: (id: string) => Promise<boolean> | boolean | void;
  onConfirmBoarding?: (
    id: string,
    pin?: string,
  ) => Promise<boolean> | boolean | void;
  onStart?: (id: string) => void;
  onComplete?: (id: string, ride?: MobilityRide) => void;
  onCancel?: (id: string) => void;
  loading: boolean;
  isSuspended?: boolean;
}

/**
 * Lifecycle-safe adapter around the existing DriverRidesList presentation.
 *
 * DriverRidesList predates the canonical RideStateMachine and still contains
 * presentation-level compatibility checks. This adapter is the action
 * authority: callbacks are only exposed when DriverRideActionPolicy permits
 * the transition. One ride is rendered at a time so policy is evaluated per
 * row without changing the existing card layout.
 *
 * Passenger progression controls live here rather than inside the legacy card:
 * driver_accepted -> driver_arriving -> passenger_boarded -> in_progress.
 */
export function CanonicalDriverRidesList({
  rides,
  type,
  onAccept,
  onStartPickupRoute,
  onConfirmBoarding,
  onStart,
  onComplete,
  onCancel,
  loading,
  isSuspended,
}: CanonicalDriverRidesListProps) {
  if (loading || type !== "accepted" || rides.length === 0) {
    return (
      <DriverRidesList
        rides={rides}
        type={type}
        onAccept={onAccept}
        onStart={type === "accepted" ? undefined : onStart}
        onComplete={type === "accepted" ? undefined : onComplete}
        onCancel={type === "accepted" ? undefined : onCancel}
        loading={loading}
        isSuspended={isSuspended}
      />
    );
  }

  return (
    <div className="space-y-2">
      {rides.map((ride) => {
        const actions = getDriverRideActionAvailability(ride.status);

        return (
          <div key={ride.id}>
            <DriverPassengerRideProgression
              rideId={ride.id}
              status={ride.status}
              onStartPickupRoute={
                actions.canStartPickupRoute ? onStartPickupRoute : undefined
              }
              onConfirmBoarding={
                actions.canConfirmBoarding ? onConfirmBoarding : undefined
              }
            />
            <DriverRidesList
              rides={[ride]}
              type="accepted"
              onStart={actions.canStart ? onStart : undefined}
              onComplete={actions.canComplete ? onComplete : undefined}
              onCancel={actions.canCancel ? onCancel : undefined}
              loading={false}
              isSuspended={isSuspended}
            />
          </div>
        );
      })}
    </div>
  );
}
