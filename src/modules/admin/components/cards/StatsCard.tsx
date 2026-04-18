/**
 * StatsCard - Card de estatísticas clicável
 * 
 * SSOT: Componente reutilizável
 * Sem gambiarras: Props tipadas e código limpo
 */

import { cn } from "@/shared/utils/cn";
import { Badge } from "@/shared/components/ui/badge";
import type { StatsCardProps } from "../../sections/types";

export function StatsCard({
  label,
  value,
  icon: Icon,
  isActive,
  onClick,
  activeLabel,
  color = "primary",
}: StatsCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "bg-card border rounded-xl p-5 hover:shadow-lg transition-all text-left group/card",
        `hover:border-${color}/50`,
        isActive && `ring-2 ring-${color} border-${color} shadow-md`
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "p-3 rounded-xl transition-colors",
            isActive ? `bg-${color} text-${color}-foreground` : `bg-${color}/10`
          )}
        >
          <Icon className={cn("h-5 w-5", !isActive && `text-${color}`)} />
        </div>
        <div>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
      {isActive && activeLabel && (
        <Badge className="mt-3 text-[10px]">{activeLabel}</Badge>
      )}
    </button>
  );
}
