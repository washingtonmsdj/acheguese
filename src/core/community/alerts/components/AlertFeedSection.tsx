/**
 * AlertFeedSection — Seção de alertas no feed da comunidade.
 *
 * Exibida separadamente dos posts comuns e mantida fora do runtime enquanto o
 * produto Community Alerts estiver pausado.
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

  if (!COMMUNITY_ALERTS_ENABLED) return null;

  return (
    <section aria-label="Alertas da comunidade" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="flex min-w-0 items-center gap-2 text-sm font-semibold text-territory-error transition-colors hover:text-territory-error/80"
          onClick={() => setCollapsed((current) => !current)}
          aria-expanded={!collapsed}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Alertas da comunidade</span>
          {alerts.length > 0 ? (
            <span className="rounded-full bg-territory-error/12 px-1.5 py-0.5 text-xs font-bold text-territory-error">
              {alerts.length}
            </span>
          ) : null}
          {collapsed ? (
            <ChevronDown className="h-3 w-3 shrink-0" aria-hidden="true" />
          ) : (
            <ChevronUp className="h-3 w-3 shrink-0" aria-hidden="true" />
          )}
        </button>

        <Button
          size="sm"
          variant="outline"
          className="shrink-0 gap-1 border-territory-error/30 bg-territory-surface text-xs text-territory-error hover:bg-territory-error/10 hover:text-territory-error"
          onClick={handleOpenCreateAlert}
          disabled={!locationId}
          aria-label="Criar novo alerta"
        >
          <Plus className="h-3 w-3" aria-hidden="true" />
          Novo alerta
        </Button>
      </div>

      {!collapsed ? (
        <div className="space-y-3">
          {isLoading ? (
            <>
              <AlertCardSkeleton />
              <AlertCardSkeleton />
            </>
          ) : alerts.length === 0 ? (
            <p className="py-2 text-xs text-territory-muted">
              Nenhum alerta ativo nesta região.
            </p>
          ) : (
            alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
          )}
        </div>
      ) : null}

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
