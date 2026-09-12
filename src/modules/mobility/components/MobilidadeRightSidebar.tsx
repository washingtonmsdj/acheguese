import React from "react";
import { MapPin, Car, Package, Users, Zap } from "lucide-react";
import type { RideRequest } from "@/core/mobility/types";
import {
  isDriverOwnedOpenRideStatus,
  isOpenRideStatus,
} from "@/core/mobility/core/RideLifecycleStatus";
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
  const openRides = rides.filter((ride) => isOpenRideStatus(ride.status));
  const operationalRides = rides.filter((ride) =>
    isDriverOwnedOpenRideStatus(ride.status),
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
                {openRides.length}
              </span>
            </div>
            <span className="text-[0.55rem] text-gray-500">Pedidos Ativos</span>
          </div>
        </div>
      </div>

      {operationalRides.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#1E2529] p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-white">
              Em Andamento
            </span>
          </div>
          <div className="space-y-2">
            {operationalRides.map((ride) => (
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
    </div>
  );
}
