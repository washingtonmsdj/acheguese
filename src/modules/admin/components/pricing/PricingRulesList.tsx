import React, { useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Edit, Power, PowerOff, Trash2 } from "lucide-react";
import { PricingRuleDialog } from "./PricingRuleDialog";
import { pricingService } from "@/core/pricing/services/PricingService";
import { PricingError } from "@/core/pricing/types";
import { useSessionContext } from "@/core/session/hooks/useSessionContext";
import { logger } from "@/shared/utils/logger";
import { toast } from "sonner";
import type { PricingRule } from "@/core/pricing/types";

interface PricingRulesListProps {
  rules: PricingRule[];
  loading: boolean;
  onRefetch: () => void;
}

export function PricingRulesList({
  rules,
  loading,
  onRefetch,
}: PricingRulesListProps) {
  const { activeProfile, user } = useSessionContext();
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleToggleActive = async (rule: PricingRule) => {
    const userId = activeProfile?.id ?? user?.id ?? null;
    if (!userId) {
      toast.error("Sessao administrativa indisponivel");
      return;
    }

    setActionLoading(rule.id);
    try {
      await pricingService.updateRule(
        rule.id,
        { isActive: !rule.isActive },
        userId
      );
      toast.success(
        rule.isActive ? "Regra desativada" : "Regra ativada"
      );
      onRefetch();
    } catch (err: any) {
      const errorMessage = err?.message || String(err);
      logger.error("Error toggling rule:", errorMessage);
      
      // Detectar conflito via tipo de erro
      if (err instanceof PricingError && err.isConflict()) {
        toast.error("Conflito: jÃ¡ existe regra ativa para este modo");
      } else if (errorMessage.includes('Conflito') || errorMessage.includes('conflito')) {
        toast.error("NÃ£o Ã© possÃ­vel desativar a Ãºnica regra ativa desta modalidade");
      } else if (err?.code === '23514' || err?.hint?.includes('validate_single_active_rule')) {
        toast.error("NÃ£o Ã© possÃ­vel desativar a Ãºnica regra ativa desta modalidade");
      } else {
        toast.error(errorMessage || "Erro ao alterar regra");
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-card">
        <p className="text-muted-foreground">Nenhuma regra cadastrada</p>
      </div>
    );
  }

  // Agrupar por modo
  const rulesByMode = rules.reduce((acc, rule) => {
    if (!acc[rule.mode]) acc[rule.mode] = [];
    acc[rule.mode].push(rule);
    return acc;
  }, {} as Record<string, PricingRule[]>);

  return (
    <>
      <div className="space-y-4">
        {Object.entries(rulesByMode).map(([mode, modeRules]) => (
          <div key={mode} className="border rounded-lg bg-card">
            <div className="p-4 border-b bg-muted/50">
              <h3 className="font-semibold text-foreground capitalize">
                {mode === "ride" && "Corrida"}
                {mode === "delivery" && "Entrega"}
                {mode === "mototaxi" && "MototÃ¡xi"}
                {mode === "motoboy" && "Motoboy"}
                {!["ride", "delivery", "mototaxi", "motoboy"].includes(mode) &&
                  mode}
              </h3>
            </div>
            <div className="divide-y">
              {modeRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {rule.name}
                      </span>
                      <Badge
                        variant={rule.isActive ? "default" : "secondary"}
                      >
                        {rule.isActive ? "Ativa" : "Inativa"}
                      </Badge>
                      {rule.peakHourMultipliers &&
                        Object.keys(rule.peakHourMultipliers).length > 0 && (
                          <Badge variant="outline">
                            {Object.keys(rule.peakHourMultipliers).length}{" "}
                            multiplicadores
                          </Badge>
                        )}
                      {rule.additionalFees &&
                        rule.additionalFees.length > 0 && (
                          <Badge variant="outline">
                            {rule.additionalFees.length} taxas
                          </Badge>
                        )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex gap-4">
                        <span>Base: R$ {rule.baseFare.toFixed(2)}</span>
                        <span>
                          Por km: R$ {rule.pricePerKm.toFixed(2)}
                        </span>
                        <span>
                          Por min: R$ {rule.pricePerMinute.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex gap-4">
                        <span>
                          MÃ­nimo: R$ {rule.minimumFare.toFixed(2)}
                        </span>
                        {rule.maximumFare && (
                          <span>
                            MÃ¡ximo: R$ {rule.maximumFare.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingRule(rule)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(rule)}
                      disabled={actionLoading === rule.id}
                    >
                      {rule.isActive ? (
                        <PowerOff className="h-4 w-4 text-destructive" />
                      ) : (
                        <Power className="h-4 w-4 text-success" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      {editingRule && (
        <PricingRuleDialog
          open={!!editingRule}
          onOpenChange={(open) => !open && setEditingRule(null)}
          rule={editingRule}
          onSuccess={() => {
            setEditingRule(null);
            onRefetch();
          }}
        />
      )}
    </>
  );
}



