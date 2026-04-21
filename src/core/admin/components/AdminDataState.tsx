import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface AdminDataStateProps {
  loading?: boolean;
  isEmpty?: boolean;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  children: ReactNode;
  className?: string;
}

export function AdminDataState({
  loading = false,
  isEmpty = false,
  loadingLabel = "Carregando dados administrativos...",
  emptyTitle = "Nenhum resultado encontrado",
  emptyDescription = "Ajuste os filtros ou revise a cobertura desta superficie.",
  children,
  className,
}: AdminDataStateProps) {
  if (loading) {
    return (
      <div className={cn("flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed", className)}>
        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>{loadingLabel}</span>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={cn("rounded-2xl border border-dashed bg-muted/20 p-8 text-center", className)}>
        <p className="text-sm font-medium">{emptyTitle}</p>
        <p className="mt-2 text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return <>{children}</>;
}
