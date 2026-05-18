import { RIDE_STATUS } from "@/shared/types/constants";
import { RideRequest } from "@/modules/mobility/types";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type TimelineRide = RideRequest & {
  driver_assigned_at?: string | null;
  driver_on_the_way_at?: string | null;
  driver_arrived_at?: string | null;
  passenger_on_board_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
};

interface StatusTimelineProps {
  ride: TimelineRide;
}

interface TimelineStep {
  status: string;
  label: string;
  icon: string;
  timestamp?: string;
  completed: boolean;
  current: boolean;
}

export function StatusTimeline({ ride }: StatusTimelineProps) {
  const steps: TimelineStep[] = [
    {
      status: RIDE_STATUS.PENDING,
      label: "Pedido Criado",
      icon: "📝",
      timestamp: ride.created_at,
      completed: true,
      current: ride.status === RIDE_STATUS.PENDING,
    },
    {
      status: RIDE_STATUS.DRIVER_ASSIGNED,
      label: "Motorista Aceitou",
      icon: "✅",
      timestamp: ride.driver_assigned_at,
      completed: !!ride.driver_assigned_at,
      current: ride.status === RIDE_STATUS.DRIVER_ASSIGNED,
    },
    {
      status: RIDE_STATUS.DRIVER_ON_THE_WAY,
      label: "A Caminho",
      icon: "🚗",
      timestamp: ride.driver_on_the_way_at,
      completed: !!ride.driver_on_the_way_at,
      current: ride.status === RIDE_STATUS.DRIVER_ON_THE_WAY,
    },
    {
      status: RIDE_STATUS.DRIVER_ARRIVED,
      label: "Motorista Chegou",
      icon: "📍",
      timestamp: ride.driver_arrived_at,
      completed: !!ride.driver_arrived_at,
      current: ride.status === RIDE_STATUS.DRIVER_ARRIVED,
    },
    {
      status: RIDE_STATUS.PASSENGER_ON_BOARD,
      label: "Passageiro Embarcou",
      icon: "👤",
      timestamp: ride.passenger_on_board_at,
      completed: !!ride.passenger_on_board_at,
      current: ride.status === RIDE_STATUS.PASSENGER_ON_BOARD,
    },
    {
      status: RIDE_STATUS.IN_PROGRESS,
      label: "Em Viagem",
      icon: "🚗",
      timestamp: ride.started_at,
      completed: !!ride.started_at,
      current: ride.status === RIDE_STATUS.IN_PROGRESS,
    },
    {
      status: RIDE_STATUS.COMPLETED,
      label: "Concluída",
      icon: "✅",
      timestamp: ride.completed_at,
      completed: !!ride.completed_at,
      current: ride.status === RIDE_STATUS.COMPLETED,
    },
  ];

  // Filtrar apenas steps relevantes (não mostrar completed se foi cancelada)
  const relevantSteps =
    ride.status === RIDE_STATUS.CANCELLED
      ? steps.filter((s) => s.completed)
      : steps;

  return (
    <div className="space-y-4">
      {relevantSteps.map((step, index) => (
        <div key={step.status} className="flex gap-3">
          {/* Ícone e linha */}
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
              {step.icon}
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

          {/* Conteúdo */}
          <div className="flex-1 pb-4">
            <div className="flex items-center justify-between">
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
            {step.current && !step.completed && (
              <p className="mt-1 text-xs text-gray-500">Em andamento...</p>
            )}
          </div>
        </div>
      ))}

      {/* Status cancelado */}
      {ride.status === RIDE_STATUS.CANCELLED && (
        <div className="flex gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-red-500 bg-red-50 text-sm">
            ❌
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
