import React, { useState } from "react";
import { Car, Filter, History, Power, Crown, Shield, Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Switch } from "@/shared/components/ui/switch";
import { cn } from "@/shared/utils/cn";
import type { MobilidadeFilters, RideType } from "@/modules/mobility/types"; // TODO: Migrar para mobility.generated.ts;

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
    <div className="space-y-3 w-full">
      {/* Action buttons */}
      <Button
        onClick={onOpenCreateRide}
        className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-semibold rounded-xl h-10 shadow-lg shadow-teal-500/20"
      >
        <Plus className="h-4 w-4 mr-2" />
        Solicitar Viagem
      </Button>

      {/* Driver status */}
      {isDriver ? (
        <div className="rounded-2xl border border-white/10 bg-[#1E2529] p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Power
                className={cn(
                  "h-4 w-4",
                  isDriverOnline ? "text-emerald-400" : "text-gray-500",
                )}
              />
              <span className="text-xs font-semibold text-white">
                Status Motorista
              </span>
            </div>
            <Switch
              checked={isDriverOnline}
              onCheckedChange={onToggleOnline}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium",
              isDriverOnline
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-white/5 text-gray-500",
            )}
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isDriverOnline ? "bg-emerald-400 animate-pulse" : "bg-gray-600",
              )}
            />
            {isDriverOnline ? "Online - Recebendo pedidos" : "Offline"}
          </div>

          {/* Plan badge */}
          <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Crown className="h-3 w-3 text-amber-400" />
            <span className="text-[0.65rem] text-amber-400 font-medium">
              Plano Padrão
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#1E2529] p-3">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-teal-400" />
            <span className="text-xs font-semibold text-white">
              Seja Motorista
            </span>
          </div>
          <p className="text-[0.65rem] text-gray-400 mb-3">
            Cadastre-se como motorista e ganhe dinheiro levando vizinhos.
          </p>
          <Button
            onClick={onOpenDriverRegistration}
            variant="outline"
            size="sm"
            className="w-full border-teal-400/30 text-teal-400 hover:bg-teal-400/10 rounded-xl text-xs"
          >
            Cadastrar como Motorista
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-white/10 bg-[#1E2529] p-3">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-semibold text-white">Filtros</span>
        </div>
        <div className="space-y-1.5">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFiltersChange({ ...filters, type: opt.value })}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                filters.type === opt.value
                  ? "bg-teal-400/10 text-teal-400 border border-teal-400/20"
                  : "text-gray-400 hover:bg-white/5 border border-transparent",
              )}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* My rides */}
      <div className="rounded-2xl border border-white/10 bg-[#1E2529] p-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <History className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-white">
              Minhas Viagens
            </span>
          </div>
          <Badge className="bg-white/10 text-gray-400 text-[0.6rem] px-1.5 rounded-full">
            {myRidesCount}
          </Badge>
        </div>
        <p className="text-[0.6rem] text-gray-500">
          Veja seu histórico de viagens e entregas.
        </p>
      </div>
    </div>
  );
}
