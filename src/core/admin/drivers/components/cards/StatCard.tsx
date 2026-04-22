/**
 * StatCard
 * 
 * Card de estatística reutilizável
 */

import { Card } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn";
import type { StatCardProps } from "../../sections/types";

export function StatCard({ stat }: StatCardProps) {
  const Icon = stat.icon;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("h-4 w-4", stat.color)} />
        <span className="text-xs text-muted-foreground">{stat.label}</span>
      </div>
      <div className={cn("text-2xl font-bold", stat.color)}>{stat.value}</div>
    </Card>
  );
}
