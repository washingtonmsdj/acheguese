import type { LucideIcon } from "lucide-react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";

interface AdminErrorStateProps {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  icon?: LucideIcon;
  className?: string;
}

export function AdminErrorState({
  title = "Falha ao carregar dados administrativos",
  description = "Revise a conectividade, os services canonicos e tente novamente.",
  retryLabel = "Tentar novamente",
  onRetry,
  icon: Icon = AlertTriangle,
  className,
}: AdminErrorStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-red-900 dark:text-red-100",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300">
            <Icon className="h-5 w-5" />
          </span>

          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-sm text-red-800/80 dark:text-red-100/80">{description}</p>
          </div>
        </div>

        {onRetry ? (
          <Button
            variant="outline"
            onClick={onRetry}
            className="border-red-500/30 bg-background/70 text-foreground hover:bg-background"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {retryLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
