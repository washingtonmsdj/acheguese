import React from "react";
import { Badge } from "@/shared/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePricingAuditLog } from "../../hooks/usePricingAuditLog";
import type { ComponentProps } from "react";

export function PricingAuditLog() {
  const { logs, loading } = usePricingAuditLog(20);
  const typedLogs = logs as Array<{ id: string; action: string; created_at: string; new_values?: Record<string, unknown> }>;
  type BadgeVariant = ComponentProps<typeof Badge>["variant"];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (typedLogs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          Nenhum registro de auditoria
        </p>
      </div>
    );
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      rule_created: "Criada",
      rule_updated: "Atualizada",
      rule_activated: "Ativada",
      rule_deactivated: "Desativada",
    };
    return Object.entries(labels).find(([key]) => key === action)?.[1] ?? action;
  };

  const getActionColor = (action: string): BadgeVariant => {
    if (action === "rule_created") return "default";
    if (action === "rule_activated") return "default";
    if (action === "rule_deactivated") return "destructive";
    return "secondary";
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-foreground">
        Histórico de Alterações
      </h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {typedLogs.map((log) => (
          <div
            key={log.id}
            className="p-3 rounded-lg border bg-card text-sm space-y-1"
          >
            <div className="flex items-center justify-between">
              <Badge variant={getActionColor(log.action)}>
                {getActionLabel(log.action)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(log.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>
            {log.new_values?.name && (
              <p className="text-foreground font-medium">
                {String(log.new_values.name)}
              </p>
            )}
            {log.new_values?.mode && (
              <p className="text-xs text-muted-foreground capitalize">
                Modo: {String(log.new_values.mode)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}



