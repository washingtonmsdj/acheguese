import { Car, DollarSign, Star, Users, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn";
import type { MobilidadeStats } from "./AdminMobilityAnalytics.types";
import { formatAnalyticsCurrency } from "./AdminMobilityAnalytics.formatters";

type StatCard = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
};

const buildStatCards = (stats: MobilidadeStats): StatCard[] => [
  {
    label: "Total de Corridas",
    value: stats.totalRides,
    icon: Car,
    color: "bg-primary/10 text-primary",
  },
  {
    label: "Receita Total",
    value: formatAnalyticsCurrency(stats.totalRevenue),
    icon: DollarSign,
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    label: "Motoristas Ativos",
    value: stats.verifiedDrivers,
    icon: Users,
    color: "bg-sky-500/10 text-sky-600",
  },
  {
    label: "Avaliação Média",
    value: `${stats.avgRating} estrela`,
    icon: Star,
    color: "bg-amber-500/10 text-amber-600",
  },
];

export function AdminMobilityStatsCards({ stats }: { stats: MobilidadeStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {buildStatCards(stats).map((item) => (
        <Card key={item.label} className="border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center",
                  item.color,
                )}
              >
                <item.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold">{item.value}</p>
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
