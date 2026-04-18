/**
 * SecurityActionCard - Card de ação de segurança
 * 
 * SSOT: Componente reutilizável para ações de segurança
 * Sem gambiarras: Props tipadas e validadas
 */

import type { LucideIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";

export interface SecurityActionCardProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
  readonly actionLabel: string;
  readonly onAction: () => void;
  readonly tone?: "default" | "danger";
}

export function SecurityActionCard({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  tone = "default",
}: SecurityActionCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "rounded-xl p-2",
            tone === "danger"
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <Button
        size="sm"
        variant={tone === "danger" ? "destructive" : "outline"}
        className="mt-4 w-full gap-1.5"
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </div>
  );
}
