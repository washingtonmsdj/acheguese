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
    label: "Corridas criadas no período",
    value: stats.totalRides,
    icon: Car,
    color: "bg-primary/10 text-primary",
  },
  {
    label: "Valor concluído no período",
    value: formatAnalyticsCurrency(stats.completedValue),
    icon: DollarSign,
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    label: "Motoristas verificados",
    value: stats.verifiedDrivers,
    icon: Users,
    color: "bg-sky-500/10 text-sky-600",
  },
  {
    label: "Avaliação média geral",
    value: `${stats.avgRating} estrela`,
    icon: Star,
    color: "bg-amber-500/10 text-amber-600",
  },
];

export function AdminMobilityStatsCards({ stats }: { stats: MobilidadeStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {buildStatCards(stats).map((item) => (
        <Card key={item.label} className="border">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
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
