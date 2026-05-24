import React from "react";
import { MapPin, Car, Package, Users, Zap } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import type { RideRequest } from "@/modules/mobility/types";
import { RIDE_STATUS } from "@/shared/types/constants";
import { useTerritoryLabels } from "@/core/location";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

interface MobilidadeRightSidebarProps {
  rides: (RideRequest & { passenger?: { name?: string | null } | null })[];
  onlineDriversCount: number;
  resolved?: ResolvedTerritory;
}

export function MobilidadeRightSidebar({
  rides,
  onlineDriversCount,
  resolved,
}: MobilidadeRightSidebarProps) {
  const territoryLabels = useTerritoryLabels(resolved);
  const pendingRides = rides.filter((r) => r.status === RIDE_STATUS.PENDING);
  const activeRides = rides.filter(
    (r) =>
      r.status === RIDE_STATUS.DRIVER_ASSIGNED ||
      r.status === RIDE_STATUS.IN_PROGRESS,
  );

  return (
    <div className="space-y-3 w-full">
      <div className="rounded-2xl border border-white/10 bg-[#1E2529] overflow-hidden">
        <div className="relative flex min-h-48 items-center justify-center bg-gradient-to-br from-[#12181B] to-[#1E2529] p-4">
          <div className="w-full rounded-2xl border border-dashed border-teal-400/20 bg-[#12181B]/70 p-4 text-center">
            <MapPin className="mx-auto mb-3 h-6 w-6 text-teal-400" />
            <p className="text-sm font-semibold text-white">
              {territoryLabels.mapLabel}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              O mapa operacional sera exibido quando houver coordenadas reais de motoristas e pedidos.
            </p>
          </div>
        </div>

        {/* Stats below map */}
        <div className="grid grid-cols-2 gap-px bg-white/5">
          <div className="p-3 text-center bg-[#1E2529]">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Users className="h-3 w-3 text-emerald-400" />
              <span className="text-sm font-bold text-white">
                {onlineDriversCount}
              </span>
            </div>
            <span className="text-[0.55rem] text-gray-500">
              Motoristas Online
            </span>
          </div>
          <div className="p-3 text-center bg-[#1E2529]">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Zap className="h-3 w-3 text-amber-400" />
              <span className="text-sm font-bold text-white">
                {pendingRides.length}
              </span>
            </div>
            <span className="text-[0.55rem] text-gray-500">Pedidos Ativos</span>
          </div>
        </div>
      </div>

      {/* Active rides summary */}
      {activeRides.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#1E2529] p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-white">
              Em Andamento
            </span>
          </div>
          <div className="space-y-2">
            {activeRides.map((ride) => (
              <div
                key={ride.id}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/5"
              >
                {ride.type === "entrega" || ride.type === "delivery" ? (
                  <Package className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <Car className="h-3.5 w-3.5 text-teal-400" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">
                    {ride.passenger?.name || "Passageiro"}
                  </p>
                  <p className="text-[0.6rem] text-gray-500 truncate">
                    {ride.origin} - {ride.destination}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscription plans */}
      <div className="rounded-2xl border border-white/10 bg-[#1E2529] p-3">
        <h3 className="text-xs font-semibold text-white mb-2">
          Planos para Motorista
        </h3>
        <div className="space-y-2">
          <div className="p-2.5 rounded-xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Car className="h-3 w-3 text-teal-400" />
              <span className="text-xs font-semibold text-white">Padrao</span>
            </div>
            <ul className="space-y-0.5">
              <li className="text-[0.6rem] text-gray-400">
                Visualizar pedidos
              </li>
              <li className="text-[0.6rem] text-gray-400">
                Aceitar corridas
              </li>
            </ul>
          </div>
          <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="h-3 w-3 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">
                Prioritario
              </span>
              <Badge className="bg-amber-500/20 text-amber-400 text-[0.5rem] px-1 py-0 rounded-full ml-auto">
                PRO
              </Badge>
            </div>
            <ul className="space-y-0.5">
              <li className="text-[0.6rem] text-gray-400">
                Notificacoes primeiro
              </li>
              <li className="text-[0.6rem] text-gray-400">
                Destaque no mapa
              </li>
              <li className="text-[0.6rem] text-gray-400">
                Destaque na lista
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
