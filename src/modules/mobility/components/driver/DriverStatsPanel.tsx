import React from "react";
import {
  Car,
  CheckCircle2,
  XCircle,
  Star,
  TrendingUp,
  Clock,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { DriverStats } from "@/core/mobility/types";

interface DriverStatsPanelProps {
  stats: DriverStats;
}

export function DriverStatsPanel({ stats }: DriverStatsPanelProps) {
  const items = [
    {
      label: "Corridas Totais",
      value: stats.totalRides.toString(),
      icon: Car,
      color: "text-teal-400",
      bg: "bg-teal-500/10",
    },
    {
      label: "Concluídas",
      value: stats.completedRides.toString(),
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Canceladas",
      value: stats.cancelledRides.toString(),
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      label: "Avaliação",
      value: stats.avgRating.toFixed(1),
      icon: Star,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Taxa Aceitação",
      value: `${stats.acceptanceRate}%`,
      icon: TrendingUp,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      label: "Horas Hoje",
      value: `${stats.onlineHoursToday}h`,
      icon: Clock,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-white/10 bg-[#1E2529] p-3 text-center"
        >
          <div
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2",
              item.bg,
            )}
          >
            <item.icon className={cn("h-4 w-4", item.color)} />
          </div>
          <p className={cn("text-base font-bold", item.color)}>{item.value}</p>
          <p className="text-[0.55rem] text-gray-500 mt-0.5">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
