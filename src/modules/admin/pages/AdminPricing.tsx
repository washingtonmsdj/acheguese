import React, { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { PricingRulesList } from "../components/pricing/PricingRulesList";
import { PricingRuleDialog } from "../components/pricing/PricingRuleDialog";
import { PricingAuditLog } from "../components/pricing/PricingAuditLog";
import { usePricingRules } from "../hooks/usePricingRules";

export default function AdminPricing() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const { rules, loading, refetch } = usePricingRules();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Gerenciamento de Pricing
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencie regras de precificação por modalidade
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAuditLog(!showAuditLog)}
          >
            {showAuditLog ? "Ocultar" : "Ver"} Auditoria
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Regra
          </Button>
        </div>
      </div>

      {/* Audit Log */}
      {showAuditLog && (
        <div className="border rounded-lg p-4 bg-card">
          <PricingAuditLog />
        </div>
      )}

      {/* Rules List */}
      <PricingRulesList rules={rules} loading={loading} onRefetch={refetch} />

      {/* Create Dialog */}
      <PricingRuleDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false);
          refetch();
        }}
      />
    </div>
  );
}
