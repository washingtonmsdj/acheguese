import React from "react";
import { Car, Crown, Filter, History, Plus, Power, Shield } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Switch } from "@/shared/components/ui/switch";
import { cn } from "@/shared/utils/cn";
import type { MobilidadeFilters, RideType } from "@/core/mobility/types";

interface MobilidadeLeftSidebarProps {
  filters: MobilidadeFilters;
  onFiltersChange: (filters: MobilidadeFilters) => void;
  isDriver: boolean;
  isDriverOnline: boolean;
  onToggleOnline: () => void;
  onOpenDriverRegistration: () => void;
  onOpenCreateRide: () => void;
  myRidesCount: number;
}

export function MobilidadeLeftSidebar({
  filters,
  onFiltersChange,
  isDriver,
  isDriverOnline,
  onToggleOnline,
  onOpenDriverRegistration,
  onOpenCreateRide,
  myRidesCount,
}: MobilidadeLeftSidebarProps) {
  const typeOptions: {
    value: RideType | "all";
    label: string;
    icon: React.ReactNode;
  }[] = [
    { value: "all", label: "Todos", icon: <Filter className="h-3.5 w-3.5" /> },
    {
      value: "viagem",
      label: "Viagens",
      icon: <Car className="h-3.5 w-3.5" />,
    },
    {
      value: "entrega",
      label: "Entregas",
      icon: <Car className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <div className="w-full space-y-3 text-territory-ink">
      <Button
        onClick={onOpenCreateRide}
        className="h-10 w-full rounded-xl bg-territory-brand font-semibold text-[hsl(var(--territory-on-image))] shadow-sm hover:bg-territory-brand-strong"
      >
        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
        Solicitar viagem
      </Button>

      {isDriver ? (
        <div className="rounded-2xl border border-territory-border bg-territory-surface p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Power
                className={cn(
                  "h-4 w-4",
                  isDriverOnline ? "text-success" : "text-territory-muted",
                )}
                aria-hidden="true"
              />
              <span className="text-xs font-semibold text-territory-ink">
                Status do motorista
              </span>
            </div>
            <Switch
              checked={isDriverOnline}
              onCheckedChange={onToggleOnline}
              className="data-[state=checked]:bg-success"
              aria-label={isDriverOnline ? "Ficar offline" : "Ficar online"}
            />
          </div>
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium",
              isDriverOnline
                ? "bg-success/10 text-success"
                : "bg-territory-raised text-territory-muted",
            )}
          >
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                isDriverOnline
                  ? "animate-pulse bg-success motion-reduce:animate-none"
                  : "bg-territory-disabled",
              )}
              aria-hidden="true"
            />
            {isDriverOnline ? "Online — recebendo pedidos" : "Offline"}
          </div>

          <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-territory-warning/20 bg-territory-warning/10 px-2.5 py-1.5">
            <Crown className="h-3 w-3 text-territory-warning" aria-hidden="true" />
            <span className="text-[0.65rem] font-medium text-territory-warning">
              Plano Padrão
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-territory-border bg-territory-surface p-3">
          <div className="mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-territory-brand" aria-hidden="true" />
            <span className="text-xs font-semibold text-territory-ink">
              Seja motorista
            </span>
          </div>
          <p className="mb-3 text-[0.65rem] text-territory-muted">
            Cadastre-se como motorista e ganhe dinheiro levando vizinhos.
          </p>
          <Button
            onClick={onOpenDriverRegistration}
            variant="outline"
            size="sm"
            className="w-full rounded-xl border-territory-brand/30 text-xs text-territory-brand hover:bg-territory-brand/10"
          >
            Cadastrar como motorista
          </Button>
        </div>
      )}

      <div className="rounded-2xl border border-territory-border bg-territory-surface p-3">
        <div className="mb-2 flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-territory-muted" aria-hidden="true" />
          <span className="text-xs font-semibold text-territory-ink">Filtros</span>
        </div>
        <div className="space-y-1.5">
          {typeOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              onClick={() => onFiltersChange({ ...filters, type: option.value })}
              className={cn(
                "flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-territory-focus",
                filters.type === option.value
                  ? "border-territory-brand/20 bg-territory-brand/10 text-territory-brand"
                  : "border-transparent text-territory-muted hover:bg-territory-raised hover:text-territory-ink",
              )}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-territory-border bg-territory-surface p-3">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-3.5 w-3.5 text-territory-muted" aria-hidden="true" />
            <span className="text-xs font-semibold text-territory-ink">
              Minhas viagens
            </span>
          </div>
          <Badge className="rounded-full bg-territory-raised px-1.5 text-[0.6rem] text-territory-muted hover:bg-territory-raised">
            {myRidesCount}
          </Badge>
        </div>
        <p className="text-[0.6rem] text-territory-muted">
          Veja seu histórico de viagens e entregas.
        </p>
      </div>
    </div>
  );
}
