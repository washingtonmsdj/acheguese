/**
 * AdminMotoristasStatsSection
 * 
 * Grid de cards de estatísticas
 */

import {
  Users,
  Clock,
  CheckCircle,
  Car,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import type { AdminMotoristasStatsSectionProps, StatItem } from "./types";
import { StatCard } from "../components/cards";
import { formatCurrency } from "../utils";

export function AdminMotoristasStatsSection({
  stats,
}: AdminMotoristasStatsSectionProps) {
  const statItems: readonly StatItem[] = [
    {
      label: "Total",
      value: stats.total,
      icon: Users,
      color: "text-foreground",
    },
    {
      label: "Pendentes",
      value: stats.pending,
      icon: Clock,
      color: "text-yellow-500",
    },
    {
      label: "Aprovados",
      value: stats.approved,
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      label: "Online",
      value: stats.online,
      icon: Car,
      color: "text-teal-500",
    },
    {
      label: "Corridas",
      value: stats.totalRides,
      icon: TrendingUp,
      color: "text-blue-500",
    },
    {
      label: "Receita",
      value: formatCurrency(stats.totalEarnings),
      icon: DollarSign,
      color: "text-emerald-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {statItems.map((stat) => (
        <StatCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
