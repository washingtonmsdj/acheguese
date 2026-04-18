/**
 * DashboardMetricCard - Card de métrica do dashboard
 * 
 * SSOT: Componente reutilizável para métricas
 * Sem gambiarras: Props tipadas e validadas
 */

import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export interface DashboardMetricCardProps {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly value: number | string;
  readonly trend?: string;
  readonly trendUp?: boolean;
  readonly highlight?: boolean;
  readonly description: string;
}

export function DashboardMetricCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
  highlight,
  description,
}: DashboardMetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 transition-all hover:shadow-md",
        highlight
          ? "border-primary/50 bg-primary/5"
          : "border-border bg-card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div
          className={cn(
            "rounded-xl p-2.5",
            highlight
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend ? (
        <div className="mt-4 flex items-center gap-1.5">
          <ArrowRight
            className={cn(
              "h-3.5 w-3.5",
              trendUp ? "rotate-[-45deg] text-green-600" : "rotate-45 text-red-600",
            )}
          />
          <span
            className={cn(
              "text-xs font-semibold",
              trendUp ? "text-green-600" : "text-red-600",
            )}
          >
            {trend}
          </span>
          <span className="text-xs text-muted-foreground">vs. mês anterior</span>
        </div>
      ) : null}
    </div>
  );
}
