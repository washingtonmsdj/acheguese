import { AlertTriangle, Ban } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";

interface WarningCardProps {
  warning: {
    tipo: "advertencia" | "suspensao_7d" | "suspensao_permanente";
    created_at?: string | null;
    motivo?: string | null;
  };
  targetUser?: { name?: string | null } | null;
  adminUser?: { name?: string | null } | null;
}

export function WarningCard({
  warning,
  targetUser,
  adminUser,
}: WarningCardProps) {
  const isWarning = warning.tipo === "advertencia";

  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
            isWarning ? "bg-warning/10" : "bg-destructive/10",
          )}
        >
          {isWarning ? (
            <AlertTriangle className="h-4 w-4 text-warning" />
          ) : (
            <Ban className="h-4 w-4 text-destructive" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] capitalize",
                isWarning
                  ? "bg-warning/10 text-warning"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {warning.tipo === "advertencia"
                ? "Advertência"
                : warning.tipo === "suspensao_7d"
                  ? "Suspensão 7d"
                  : "Suspensão Permanente"}
            </Badge>
            <span className="text-xs font-medium">
              {targetUser?.name || "Usuário"}
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto">
              {warning.created_at
                ? new Date(warning.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{warning.motivo}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Por: {adminUser?.name || "Admin"}
          </p>
        </div>
      </div>
    </div>
  );
}
