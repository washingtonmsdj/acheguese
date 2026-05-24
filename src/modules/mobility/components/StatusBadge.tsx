import { RIDE_STATUS_LABELS } from "@/modules/mobility/constants";
import type { RideStatus } from "@/modules/mobility/types";

interface StatusBadgeProps {
  status: RideStatus;
  size?: "sm" | "md" | "lg";
}

const statusColorClasses: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  requested: "bg-yellow-100 text-yellow-800 border-yellow-200",
  searching_driver: "bg-amber-100 text-amber-800 border-amber-200",
  driver_assigned: "bg-blue-100 text-blue-800 border-blue-200",
  driver_accepted: "bg-blue-100 text-blue-800 border-blue-200",
  driver_arriving: "bg-purple-100 text-purple-800 border-purple-200",
  driver_on_the_way: "bg-purple-100 text-purple-800 border-purple-200",
  driver_arrived: "bg-green-100 text-green-800 border-green-200",
  passenger_boarded: "bg-indigo-100 text-indigo-800 border-indigo-200",
  passenger_on_board: "bg-indigo-100 text-indigo-800 border-indigo-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  pickup_confirmed: "bg-green-100 text-green-800 border-green-200",
  in_delivery: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  failed_delivery: "bg-red-100 text-red-800 border-red-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  cancelled_by_passenger: "bg-red-100 text-red-800 border-red-200",
  cancelled_by_driver: "bg-red-100 text-red-800 border-red-200",
  expired: "bg-gray-100 text-gray-600 border-gray-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

const sizeClasses = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-3 py-1",
  lg: "text-base px-4 py-2",
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const colorClass = statusColorClasses[status] ?? "bg-gray-100 text-gray-600 border-gray-200";
  const label = RIDE_STATUS_LABELS[status] ?? status;
  const sizeClass = sizeClasses[size] ?? sizeClasses.md;

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${colorClass} ${sizeClass}`}>
      {label}
    </span>
  );
}
