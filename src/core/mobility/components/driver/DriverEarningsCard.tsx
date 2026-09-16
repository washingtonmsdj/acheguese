import { Calendar, DollarSign, TrendingUp, Wallet } from "lucide-react";
import type { DriverEarnings } from "@/core/mobility/types";
import { formatBrlNoCents } from "@/shared/utils/currency";
import { cn } from "@/shared/utils/cn";

interface DriverEarningsCardProps {
  earnings: DriverEarnings;
  onCardClick?: (period: "today" | "week" | "month" | "total") => void;
}

export function DriverEarningsCard({
  earnings,
  onCardClick,
}: DriverEarningsCardProps) {
  const items = [
    {
      label: "Hoje",
      value: earnings.today,
      icon: Wallet,
      color: "text-success",
      bg: "bg-success/10",
      period: "today" as const,
    },
    {
      label: "Semana",
      value: earnings.week,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
      period: "week" as const,
    },
    {
      label: "Mês",
      value: earnings.month,
      icon: Calendar,
      color: "text-info",
      bg: "bg-info/10",
      period: "month" as const,
    },
    {
      label: "Total",
      value: earnings.total,
      icon: DollarSign,
      color: "text-warning",
      bg: "bg-warning/10",
      period: "total" as const,
    },
  ];

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-3 text-card-foreground">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onCardClick?.(item.period)}
            className={cn(
              "rounded-xl p-2 text-left transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              item.bg,
            )}
          >
            <div className="mb-0.5 flex items-center gap-1">
              <item.icon className={cn("h-3 w-3", item.color)} aria-hidden="true" />
              <span className="text-[0.6rem] text-muted-foreground">
                {item.label}
              </span>
            </div>
            <p className={cn("text-base font-bold", item.color)}>
              {formatBrlNoCents(item.value)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
