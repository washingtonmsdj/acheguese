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
    totalRides: drivers.reduce((sum, d) => sum + d.total_rides, 0),
  };
}

/**
 * Filtra motoristas por status e busca.
 * A lista recebida é sempre o conjunto administrativo completo; filtros são
 * somente de apresentação e não alteram as estatísticas globais.
 */
export function filterDrivers(
  drivers: readonly DriverRequest[],
  filter: FilterStatus,
  search: string,
): DriverRequest[] {
  let filtered = [...drivers];

  if (filter === "pending") {
    filtered = filtered.filter(isDriverPending);
  } else if (filter === "approved") {
    filtered = filtered.filter(isDriverApproved);
  } else if (filter === "rejected") {
    filtered = filtered.filter((driver) => driver.verification_status === "rejected");
  }

  const query = search.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter(
      (driver) =>
        driver.name.toLowerCase().includes(query) ||
        (driver.vehicle_plate ?? "").toLowerCase().includes(query),
    );
  }

  return filtered;
}
