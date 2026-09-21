import { RIDE_STATUS_LABELS } from "@/core/mobility/constants";
import { getRecordValue } from "@/shared/utils/recordLookup";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

const statusColorClasses: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  requested: "bg-warning/10 text-warning border-warning/20",
  searching_driver: "bg-warning/10 text-warning border-warning/20",
  driver_assigned: "bg-primary/10 text-primary border-primary/20",
  driver_accepted: "bg-primary/10 text-primary border-primary/20",
  driver_arriving: "bg-accent text-accent-foreground border-border",
  driver_on_the_way: "bg-accent text-accent-foreground border-border",
  driver_arrived: "bg-success/10 text-success border-success/20",
  passenger_boarded: "bg-primary/10 text-primary border-primary/20",
  passenger_on_board: "bg-primary/10 text-primary border-primary/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  pickup_confirmed: "bg-success/10 text-success border-success/20",
  in_delivery: "bg-accent text-accent-foreground border-border",
  delivered: "bg-success/10 text-success border-success/20",
  failed_delivery: "bg-destructive/10 text-destructive border-destructive/20",
  completed: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled_by_passenger: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled_by_driver: "bg-destructive/10 text-destructive border-destructive/20",
  expired: "bg-muted text-muted-foreground border-border",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
};

const sizeClasses = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-3 py-1",
  lg: "text-base px-4 py-2",
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const colorClass =
    getRecordValue(statusColorClasses, status) ??
    "bg-muted text-muted-foreground border-border";
  const label = getRecordValue(RIDE_STATUS_LABELS, status) ?? status;
  const sizeClass = getRecordValue(sizeClasses, size) ?? sizeClasses.md;

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${colorClass} ${sizeClass}`}
    >
      {label}
    </span>
  );
}
