import { RideStatus } from "@/modules/mobility/types"; // TODO: Migrar para mobility.generated.ts;

interface StatusBadgeProps {
  status: RideStatus;
  size?: "sm" | "md" | "lg";
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  // Estados do motor operacional
  requested: {
    label: "Solicitada",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: "🔍",
  },
  searching_driver: {
    label: "Buscando Motorista",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: "🔎",
  },
  driver_accepted: {
    label: "Motorista Aceito",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: "✅",
  },
  driver_arriving: {
    label: "Motorista a Caminho",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: "🚗",
  },
  passenger_boarded: {
    label: "Passageiro Embarcou",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    icon: "👤",
  },
  cancelled_by_passenger: {
    label: "Cancelada",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: "❌",
  },
  cancelled_by_driver: {
    label: "Cancelada pelo Motorista",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: "❌",
  },
  expired: {
    label: "Expirada",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: "⏰",
  },
  failed: {
    label: "Falhou",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: "⚠️",
  },
  // Estados legados
  pending: {
    label: "Aguardando",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: "🔍",
  },
  accepted: {
    label: "Aceita",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: "✅",
  },
  driver_assigned: {
    label: "Motorista Designado",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: "✅",
  },
  driver_on_the_way: {
    label: "A Caminho",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: "🚗",
  },
  driver_arrived: {
    label: "Motorista Chegou",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: "📍",
  },
  passenger_on_board: {
    label: "Passageiro Embarcou",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    icon: "👤",
  },
  in_progress: {
    label: "Em Viagem",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: "🚗",
  },
  completed: {
    label: "Concluída",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: "✅",
  },
  cancelled: {
    label: "Cancelada",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: "❌",
  },
};

const sizeClasses = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-3 py-1",
  lg: "text-base px-4 py-2",
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: "•",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.color} ${sizeClasses[size]}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
