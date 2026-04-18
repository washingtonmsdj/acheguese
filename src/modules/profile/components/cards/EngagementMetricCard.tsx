/**
 * EngagementMetricCard - Card de métrica de engajamento
 * 
 * SSOT: Componente reutilizável para métricas de engajamento
 * Sem gambiarras: Props tipadas e validadas
 */

import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export interface EngagementMetricCardProps {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly value: number;
  readonly color: "blue" | "purple" | "pink";
}

const COLOR_CLASSES = {
  blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  purple: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  pink: "bg-pink-500/10 text-pink-600 border-pink-500/20",
} as const;

export function EngagementMetricCard({
  icon: Icon,
  label,
  value,
  color,
}: EngagementMetricCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className={cn("rounded-xl p-2", COLOR_CLASSES[color])}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}
