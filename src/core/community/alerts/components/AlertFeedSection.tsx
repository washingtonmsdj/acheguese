/**
 * AlertFeedSection — Seção de alertas no feed da comunidade
 *
 * Exibida separadamente dos posts comuns.
 * Controlada por feature flag COMMUNITY_ALERTS_ENABLED.
 */

import { useState } from "react";
import { AlertTriangle, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { AlertCard } from "./AlertCard";
import { AlertCardSkeleton } from "./AlertCardSkeleton";
import { CreateAlertModal } from "./CreateAlertModal";
import { useAlerts } from "../hooks/useAlerts";
import { COMMUNITY_ALERTS_ENABLED } from "../config/alertConfig";
import type { TerritoryFilter } from "@/core/location/types";

interface AlertFeedSectionProps {
  territoryFilter: TerritoryFilter;
  city: string;
  neighborhood?: string;
  locationId?: string;
  canCreateAlert?: boolean;
  onBlockedCreateAlert?: () => void;
}

export function AlertFeedSection({
  territoryFilter,
  city,
  neighborhood,
  locationId,
  canCreateAlert = true,
  onBlockedCreateAlert,
}: AlertFeedSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const { data: alerts = [], isLoading } = useAlerts({ territoryFilter, limit: 10 });

  const handleOpenCreateAlert = () => {
    if (!canCreateAlert) {
      onBlockedCreateAlert?.();
      return;
    }

    setModalOpen(true);
  };

  // Feature flag — seção inteira oculta se desativada
  if (!COMMUNITY_ALERTS_ENABLED) return null;

  return (
    <section aria-label="Alertas da comunidade" className="space-y-3">
      {/* Header da seção */}
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
        >
          <AlertTriangle className="h-4 w-4" aria-hidden />
          Alertas da comunidade
          {alerts.length > 0 && (
            <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {alerts.length}
            </span>
          )}
          {collapsed ? (
            <ChevronDown className="h-3 w-3" aria-hidden />
          ) : (
            <ChevronUp className="h-3 w-3" aria-hidden />
          )}
        </button>

        <Button
          size="sm"
          variant="outline"
          className="text-xs gap-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
          onClick={handleOpenCreateAlert}
          disabled={!locationId}
          aria-label="Criar novo alerta"
        >
          <Plus className="h-3 w-3" />
          Novo alerta
        </Button>
      </div>

      {/* Lista de alertas */}
      {!collapsed && (
        <div className="space-y-3">
          {isLoading ? (
            <>
              <AlertCardSkeleton />
              <AlertCardSkeleton />
            </>
          ) : alerts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              Nenhum alerta ativo nesta região.
            </p>
          ) : (
            alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))
          )}
        </div>
      )}

      <CreateAlertModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        neighborhood={neighborhood}
        city={city}
        locationId={locationId}
        canCreate={canCreateAlert}
      />
    </section>
  );
}
