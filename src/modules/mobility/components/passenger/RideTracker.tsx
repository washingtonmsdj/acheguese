import React from "react";
import { MapPin } from "lucide-react";
import type { RideRequest } from "@/modules/mobility/types";
import { RIDE_STATUS } from "@/shared/types/constants";
interface RideTrackerProps {
  ride: RideRequest;
}

const DRIVER_ACCEPTED_STATUSES = new Set<string>([
  RIDE_STATUS.ACCEPTED,
  RIDE_STATUS.IN_PROGRESS,
  RIDE_STATUS.COMPLETED,
]);

const IN_PROGRESS_STATUSES = new Set<string>([
  RIDE_STATUS.IN_PROGRESS,
  RIDE_STATUS.COMPLETED,
]);

export function RideTracker({ ride }: RideTrackerProps) {
  const steps = [
    { label: "Pedido criado", done: true },
    {
      label: "Motorista aceito",
      done: DRIVER_ACCEPTED_STATUSES.has(ride.status),
    },
    {
      label: "Em andamento",
      done: IN_PROGRESS_STATUSES.has(ride.status),
    },
    { label: "Concluída", done: ride.status === RIDE_STATUS.COMPLETED },
  ];

  return (
    <div className="flex items-center gap-1 w-full">
      {steps.map((step, i) => (
        <React.Fragment key={step.label}>
          <div className="flex flex-col items-center">
            <div
              className={`w-3 h-3 rounded-full border-2 ${step.done ? "bg-primary border-primary" : "border-muted-foreground/30 bg-transparent"}`}
            />
            <span
              className={`text-[0.5rem] mt-1 ${step.done ? "text-primary" : "text-muted-foreground"}`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 ${step.done ? "bg-primary" : "bg-border"}`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
