import {
  Car,
  CheckCircle2,
  Clock,
  Star,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type { DriverStats } from "@/core/mobility/types";
import { cn } from "@/shared/utils/cn";

interface DriverStatsPanelProps {
  stats: DriverStats;
}

export function DriverStatsPanel({ stats }: DriverStatsPanelProps) {
  const items = [
    {
      label: "Corridas totais",
      value: stats.totalRides.toString(),
      icon: Car,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Concluídas",
      value: stats.completedRides.toString(),
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Canceladas",
      value: stats.cancelledRides.toString(),
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Avaliação",
      value: stats.avgRating.toFixed(1),
      icon: Star,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Taxa de aceitação",
      value: `${stats.acceptanceRate}%`,
      icon: TrendingUp,
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      label: "Horas hoje",
      value: `${stats.onlineHoursToday}h`,
      icon: Clock,
      color: "text-category-poll",
      bg: "bg-category-poll/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-border bg-card p-3 text-center text-card-foreground"
        >
          <div
            className={cn(
              "mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl",
              item.bg,
            )}
          >
            <item.icon className={cn("h-4 w-4", item.color)} aria-hidden="true" />
          </div>
          <p className={cn("text-base font-bold", item.color)}>{item.value}</p>
          <p className="mt-0.5 text-[0.55rem] text-muted-foreground">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
