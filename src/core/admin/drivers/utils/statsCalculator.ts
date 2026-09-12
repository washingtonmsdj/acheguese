/**
 * Stats Calculator
 * 
 * Funções para cálculo de estatísticas de motoristas
 */

import type { DriverRequest, DriverStats, FilterStatus } from "../sections/types";
import { isDriverPending, isDriverApproved, isDriverOnline } from "./driverHelpers";

/**
 * Calcula estatísticas dos motoristas
 */
export function calculateDriverStats(drivers: readonly DriverRequest[]): DriverStats {
  return {
    total: drivers.length,
    pending: drivers.filter(isDriverPending).length,
    approved: drivers.filter(isDriverApproved).length,
    online: drivers.filter(isDriverOnline).length,
    totalRides: drivers.reduce((sum, d) => sum + (d.total_rides || 0), 0),
  };
}

/**
 * Filtra motoristas por status e busca
 */
export function filterDrivers(
  drivers: readonly DriverRequest[],
  filter: FilterStatus,
  search: string
): DriverRequest[] {
  let filtered = [...drivers];

  // Aplicar filtro de status
  if (filter === "pending") {
    filtered = filtered.filter(isDriverPending);
  } else if (filter === "approved") {
    filtered = filtered.filter(isDriverApproved);
  } else if (filter === "rejected") {
    // Buscar motoristas rejeitados se houver uma coluna para isso
    filtered = [];
  }

  // Aplicar busca
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.vehicle_plate.toLowerCase().includes(q)
    );
  }

  return filtered;
}
