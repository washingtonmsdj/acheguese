import React from "react";
import { Car, MapPin, Package, Users, Zap } from "lucide-react";
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
    <div className="w-full space-y-3 text-territory-ink">
      <div className="overflow-hidden rounded-2xl border border-territory-border bg-territory-surface">
        <div className="relative flex min-h-48 items-center justify-center bg-territory-raised p-4">
          <div className="w-full rounded-2xl border border-dashed border-territory-brand/20 bg-territory-canvas/80 p-4 text-center">
            <MapPin className="mx-auto mb-3 h-6 w-6 text-territory-brand" aria-hidden="true" />
            <p className="text-sm font-semibold text-territory-ink">
              {territoryLabels.mapLabel}
            </p>
            <p className="mt-1 text-xs text-territory-muted">
              O mapa operacional será exibido quando houver coordenadas reais de motoristas e pedidos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-territory-border">
          <div className="bg-territory-surface p-3 text-center">
            <div className="mb-0.5 flex items-center justify-center gap-1">
              <Users className="h-3 w-3 text-success" aria-hidden="true" />
              <span className="text-sm font-bold text-territory-ink">
                {onlineDriversCount}
              </span>
            </div>
            <span className="text-[0.55rem] text-territory-muted">
              Motoristas online
            </span>
          </div>
          <div className="bg-territory-surface p-3 text-center">
            <div className="mb-0.5 flex items-center justify-center gap-1">
              <Zap className="h-3 w-3 text-territory-warning" aria-hidden="true" />
              <span className="text-sm font-bold text-territory-ink">
                {openRides.length}
              </span>
            </div>
            <span className="text-[0.55rem] text-territory-muted">Pedidos ativos</span>
          </div>
        </div>
      </div>

      {operationalRides.length > 0 ? (
        <div className="rounded-2xl border border-territory-border bg-territory-surface p-3">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-success motion-reduce:animate-none" aria-hidden="true" />
            <span className="text-xs font-semibold text-territory-ink">
              Em andamento
            </span>
          </div>
          <div className="space-y-2">
            {operationalRides.map((ride) => (
              <div
                key={ride.id}
                className="flex items-center gap-2 rounded-lg bg-territory-raised px-2.5 py-2"
              >
                {ride.type === "entrega" || ride.type === "delivery" ? (
                  <Package className="h-3.5 w-3.5 text-territory-warning" aria-hidden="true" />
                ) : (
                  <Car className="h-3.5 w-3.5 text-territory-brand" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-territory-ink">
                    {ride.passenger?.name || "Passageiro"}
                  </p>
                  <p className="truncate text-[0.6rem] text-territory-muted">
                    {ride.origin} — {ride.destination}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
