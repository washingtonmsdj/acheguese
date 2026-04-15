import { RIDE_STATUS } from "../constants";
import { useDriverDashboardBase } from "./useDriverDashboardBase";

/**
 * SSOT compliant driver dashboard hook
 */
export function useMotoristaPage() {
  return useDriverDashboardBase({
    queryScope: "motorista",
    allowAdminBootstrap: true,
    activeStatuses: [
      RIDE_STATUS.DRIVER_ASSIGNED,
      RIDE_STATUS.DRIVER_ON_THE_WAY,
      RIDE_STATUS.DRIVER_ARRIVED,
      RIDE_STATUS.PASSENGER_ON_BOARD,
      RIDE_STATUS.IN_PROGRESS,
    ],
    completedStatuses: [RIDE_STATUS.COMPLETED],
  });
}
