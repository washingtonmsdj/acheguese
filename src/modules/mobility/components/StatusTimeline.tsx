import type { RideRequest } from "@/core/mobility/types";
import {
  isCancelledRideStatus,
  toCanonicalRideState,
} from "@/core/mobility/core/RideLifecycleStatus";
import { RIDE_STATE, type RideState } from "@/core/mobility/core/RideStateMachine";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import {
  Car,
  CheckCircle2,
  FileText,
  MapPin,
  Search,
  User,
  XCircle,
  type LucideIcon,
} from "lucide-react";

interface StatusTimelineProps {
  ride: RideRequest;
}

interface TimelineStepDefinition {
  status: RideState;
  label: string;
  icon: LucideIcon;
  timestamp?: string | null;
}

const PASSENGER_RIDE_TIMELINE: readonly RideState[] = [
  RIDE_STATE.REQUESTED,
  RIDE_STATE.SEARCHING_DRIVER,
  RIDE_STATE.DRIVER_ASSIGNED,
  RIDE_STATE.DRIVER_ACCEPTED,
  RIDE_STATE.DRIVER_ARRIVING,
  RIDE_STATE.PASSENGER_BOARDED,
  RIDE_STATE.IN_PROGRESS,
  RIDE_STATE.COMPLETED,
];

export function StatusTimeline({ ride }: StatusTimelineProps) {
  const currentState = toCanonicalRideState(ride.status);
  const currentIndex = currentState
    ? PASSENGER_RIDE_TIMELINE.indexOf(currentState)
    : -1;

  const definitions: TimelineStepDefinition[] = [
    {
      status: RIDE_STATE.REQUESTED,
      label: "Pedido criado",
      icon: FileText,
      timestamp: ride.created_at,
    },
    {
      status: RIDE_STATE.SEARCHING_DRIVER,
      label: "Buscando motorista",
      icon: Search,
    },
    {
      status: RIDE_STATE.DRIVER_ASSIGNED,
      label: "Motorista encontrado · aguardando confirmação",
      icon: User,
      timestamp: ride.driver_assigned_at,
    },
    {
      status: RIDE_STATE.DRIVER_ACCEPTED,
      label: "Motorista confirmou",
      icon: CheckCircle2,
      timestamp: ride.accepted_at,
    },
    {
      status: RIDE_STATE.DRIVER_ARRIVING,
      label: "Motorista a caminho",
      icon: Car,
    },
    {
      status: RIDE_STATE.PASSENGER_BOARDED,
      label: "Passageiro embarcou",
      icon: User,
      timestamp: ride.passenger_on_board_at,
    },
    {
      status: RIDE_STATE.IN_PROGRESS,
      label: "Viagem em andamento",
      icon: Car,
      timestamp: ride.started_at,
    },
    {
      status: RIDE_STATE.COMPLETED,
      label: "Concluída",
      icon: CheckCircle2,
      timestamp: ride.completed_at,
    },
  ];

  const steps = definitions.map((step, index) => {
    const current = currentState === step.status;
    const completed =
      !current &&
      (currentState === RIDE_STATE.COMPLETED ||
        (currentIndex >= 0 && currentIndex > index) ||
        Boolean(step.timestamp));

    return { ...step, completed, current };
  });

  const cancelled = isCancelledRideStatus(ride.status);
  const relevantSteps = cancelled
    ? steps.filter((step) => step.completed || step.current)
    : steps;

  return (
    <div className="space-y-4">
      {relevantSteps.map((step, index) => (
        <div key={step.status} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm ${
                step.completed
                  ? "border-green-500 bg-green-50"
                  : step.current
                    ? "border-blue-500 bg-blue-50 animate-pulse"
                    : "border-gray-300 bg-gray-50"
              }`}
            >
              <step.icon className="h-4 w-4" aria-hidden="true" />
            </div>
            {index < relevantSteps.length - 1 && (
              <div
                className={`h-full w-0.5 flex-1 ${
                  step.completed ? "bg-green-500" : "bg-gray-300"
                }`}
                style={{ minHeight: "20px" }}
              />
            )}
          </div>

          <div className="flex-1 pb-4">
            <div className="flex items-center justify-between gap-3">
              <p
                className={`font-medium ${
                  step.completed
                    ? "text-gray-900"
                    : step.current
                      ? "text-blue-600"
                      : "text-gray-400"
                }`}
              >
                {step.label}
              </p>
              {step.timestamp && (
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(step.timestamp), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              )}
            </div>
            {step.current && (
              <p className="mt-1 text-xs text-gray-500">Estado atual</p>
            )}
          </div>
        </div>
      ))}

      {cancelled && (
        <div className="flex gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-red-500 bg-red-50 text-sm">
            <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-red-600">Cancelada</p>
            {ride.cancelled_at && (
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(ride.cancelled_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            )}
            {ride.cancellation_reason && (
              <p className="mt-1 text-xs text-gray-600">
                Motivo: {ride.cancellation_reason}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
